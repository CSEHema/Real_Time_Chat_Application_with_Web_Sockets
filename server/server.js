require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const { protect } = require('./middleware/authMiddleware');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);

// --- MEDIA STORAGE ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

app.post('/api/media/upload', protect, upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, type: req.file.mimetype });
});

// --- API ROUTES ---
app.get('/api/messages/:user1/:user2', protect, async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const history = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.get('/api/chats/:userId', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.params.userId })
      .populate('participants', 'name email phno');
    
    const formattedChats = chats.map(chat => {
      const otherUser = chat.participants.find(p => p._id.toString() !== req.params.userId);
      return {
        _id: otherUser?._id?.toString() || chat._id,
        name: otherUser?.name || 'Unknown User',
        lastMsg: chat.lastMessage || '',
        lastMessageTime: chat.lastMessageTime,
        online: onlineUsers.has(otherUser?._id?.toString()), // Real-time check
        isGroup: false // Forced 1:1 focus
      };
    });
    res.json(formattedChats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

let onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token provided"));
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error: Invalid token"));
    socket.userId = decoded.id;
    next();
  });
});

// --- SOCKET EVENTS ---
io.on("connection", (socket) => {
  socket.on("join_room", (userId) => {
  if (!userId || String(userId) !== String(socket.userId)) return;
  
  socket.join(userId);
  onlineUsers.set(userId, socket.id);

  const currentOnlineIds = Array.from(onlineUsers.keys());

  // 1. Tell EVERYONE (including the person who just joined) who is online
  io.emit("get_online_users", currentOnlineIds); 
  
  // 2. Extra safety: Send the list directly to the socket that just joined
  socket.emit("get_online_users", currentOnlineIds);

  console.log(`User ${userId} joined. Broadcasting online list:`, currentOnlineIds);
});

  socket.on("send_message", async (data) => {
    try {
      const newMessage = new Message({
        senderId: data.senderId,
        receiverId: data.receiverId,
        text: data.text,
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        time: data.time,
        timestamp: new Date()
      });
      await newMessage.save();

      const participants = [String(data.senderId), String(data.receiverId)].sort();
      await Chat.findOneAndUpdate(
        { participants: participants },
        { 
          $set: { 
            lastMessage: data.mediaUrl ? "📷 Media" : data.text, 
            lastMessageTime: new Date(),
            updatedAt: Date.now() 
          },
          $setOnInsert: { participants: participants } 
        },
        { upsert: true, new: true }
      );

      socket.to(data.receiverId).emit("receive_message", data);
      socket.to(data.receiverId).emit("new_chat_started", {
        _id: data.senderId,
        name: data.senderName,
        lastMsg: data.mediaUrl ? "📷 Media" : data.text,
        online: true, 
        lastMessageTime: new Date()
      });
    } catch (err) {
      console.error("Socket Error:", err);
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("get_online_users", Array.from(onlineUsers.keys()));
  });
});

server.listen(5000, () => console.log(`Server running on port 5000`));