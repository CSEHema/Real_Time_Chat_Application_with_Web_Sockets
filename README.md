# Real-Time Chat Application with WebSockets

Built a responsive 1:1 messaging platform with a Cyberpunk dark-purple aesthetic, featuring real-time communication and message persistence.

## 🚀 Key Features
* **Real-Time Chat**: Instant messaging using WebSockets (Socket.io).
* **Presence Tracking**: Live online/offline status indicators.
* **Media Sharing**: Support for image and video uploads (10MB limit).
* **Persistence**: Full chat history saved in MongoDB.
* **Security**: JWT Authentication + CAPTCHA verification.
* **Responsive**: Optimized for both Desktop and Mobile views.

## 🛠️ Tech Stack
* **MERN**: MongoDB, Express.js, React, Node.js.
* **Real-Time**: Socket.io.
* **Styling**: Tailwind CSS.

## 📂 Project Structure
```plaintext
├── client/                # React Frontend (Tailwind CSS)
│   ├── src/
│   │   ├── Components/    # Sidebar, ChatWindow, AddChat, ChatItem, Profilepic
│   │   ├── context/       # SocketContext.js
│   │   ├── pages/         # Login, Registration, Dashboard
│   │   └── static/        # Assets and Images
├── server/                # Node.js & Express Backend
│   ├── middleware/        # authMiddleware.js
│   ├── models/            # Chat.js, Message.js, User.js
│   ├── routes/            # auth.js
│   └── uploads/           # Media Storage (Images/Videos)
```
## ⚙️ Local Setup

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- MongoDB (local or cloud - Atlas recommended)

### 1. Install Dependencies

#### Backend
```bash
cd server
npm install express cors bcryptjs mongoose socket.io multer
```

###Frontend
```bash
cd client
npm install react-router-dom axios react-phone-input-2 libphonenumber-js socket.io-client
```

###2. Environment Setup
Create a ```.env``` file in the ```/server``` directory:
```bash
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### 3. Run the App  

Server: ```cd server && npm start```  

Client: ```cd client && npm start```

## 📸Screenshots
