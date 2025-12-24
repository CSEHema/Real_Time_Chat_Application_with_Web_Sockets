import React, { useState, useEffect, useRef } from "react";
import Profilepic from "../Components/Profilepic";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const ChatWindow = ({ chat, currentUser, setChatList, onBack }) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const [showSizeError, setShowSizeError] = useState(false); 
  const socket = useSocket();
  const scrollRef = useRef();
  const lastChatId = useRef();
  const fileInputRef = useRef(); 

  // 1. Fetch Chat History
  useEffect(() => {
    const fetchHistory = async () => {
      const currentId = chat._id || chat.id;
      const currentUserId = currentUser?._id || currentUser?.id;
      const token = localStorage.getItem("token");

      if (!currentUserId || !currentId || !token) return;

      if (lastChatId.current !== currentId) {
        setIsLoading(true);
        try {
          const res = await axios.get(
            `http://localhost:5000/api/messages/${currentUserId}/${currentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMessages(res.data);
          lastChatId.current = currentId;
        } catch (err) {
          console.error("Failed to load history:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchHistory();
  }, [chat._id, chat.id, currentUser]);

  // 2. Socket Listener
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (data) => {
      const activeChatId = chat._id || chat.id;
      if (String(data.senderId) === String(activeChatId)) {
        setMessages((prev) => [...prev, data]);
      }
    };
    socket.on("receive_message", handleReceiveMessage);
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [socket, chat._id, chat.id]);

  // 3. Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Media Upload Handler
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; 
    if (file.size > MAX_FILE_SIZE) {
      setShowSizeError(true);
      e.target.value = null; 
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("media", file);

    setIsUploading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/media/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      sendFinalMessage(null, res.data.url, res.data.type);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
  };

  const sendFinalMessage = (text, mediaUrl = null, mediaType = null) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const targetChatId = chat._id || chat.id;

    const msgData = {
      _id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUser?.name || "User",
      receiverId: targetChatId,
      text: text || "",
      mediaUrl,
      mediaType,
      time: new Date().toLocaleTimeString('en-US', { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      }),
    };

    socket.emit("send_message", msgData);

    if (setChatList) {
      setChatList((prev) =>
        prev.map((c) =>
          String(c._id || c.id) === String(targetChatId)
            ? { ...c, lastMsg: mediaUrl ? "📷 Media" : text }
            : c
        )
      );
    }

    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    sendFinalMessage(newMessage);
  };

  return (
    <div className="flex flex-col h-full bg-deepdark relative text-white">
      
      {/* 5. Size Limit Modal */}
      {showSizeError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deepdark/80 backdrop-blur-sm">
          <div className="bg-darkpurple p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 text-center border border-white/5">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">File Too Large</h3>
            <p className="text-gray-400 text-sm mb-6">
              The selected file exceeds the 10MB limit. Please choose a smaller file.
            </p>
            <button 
              onClick={() => setShowSizeError(false)}
              className="w-full py-2 bg-vibrantpurple text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 bg-darkpurple flex items-center border-b border-white/5 shadow-sm">
        <button 
          onClick={onBack} 
          className="md:hidden mr-3 p-2 text-gray-400 hover:bg-lightdark rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center space-x-3">
          <Profilepic name={chat.name} online={chat.online} />
          <div>
            <h2 className="font-bold text-white">{chat.name}</h2>
            <p className={`text-xs font-medium ${chat.online ? "text-green-500" : "text-gray-500"}`}>
              {chat.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-deepdark">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-gray-500 text-sm italic">Loading messages...</div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.senderId) === String(currentUser?._id || currentUser?.id);
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm text-sm ${
                  isMe 
                    ? "bg-vibrantpurple text-white rounded-tr-none" 
                    : "bg-darkpurple text-white rounded-tl-none border border-white/5"
                }`}>
                  {msg.mediaUrl && (
                    <div className="mb-2">
                      {msg.mediaType?.startsWith("image/") ? (
                        <img src={msg.mediaUrl} alt="Sent" className="rounded-lg max-h-60 w-full object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(msg.mediaUrl)} />
                      ) : (
                        <video controls className="rounded-lg max-h-60 w-full">
                          <source src={msg.mediaUrl} type={msg.mediaType} />
                        </video>
                      )}
                    </div>
                  )}
                  {msg.text && <p className="break-words">{msg.text}</p>}
                  <p className={`text-[10px] mt-1 text-right ${isMe ? "text-white/70" : "text-gray-500"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-darkpurple border-t border-white/5">
        {isUploading && <div className="text-xs text-vibrantpurple mb-2 animate-pulse font-bold">Uploading media...</div>}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
          
          <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-vibrantpurple transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            type="text"
            className="flex-1 bg-lightdark border-none rounded-full px-4 py-2 focus:ring-1 focus:ring-vibrantpurple outline-none text-sm text-white placeholder-gray-500"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="p-2 bg-vibrantpurple text-white rounded-full hover:opacity-90 transition active:scale-90 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;