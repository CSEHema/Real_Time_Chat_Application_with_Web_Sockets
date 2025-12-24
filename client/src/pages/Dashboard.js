import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import ChatWindow from "../Components/ChatWindow";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../context/SocketContext";

const Dashboard = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatList, setChatList] = useState([]);
  
  // New state to toggle sidebar on mobile
  const [showSidebar, setShowSidebar] = useState(true);

  const socket = useSocket();
  const navigate = useNavigate();

  // Handle chat selection and mobile toggle
  const handleSelectChat = (chat) => {
    const id = String(chat._id || chat.id);
    setSelectedChatId(id);
    setShowSidebar(false); // Hide sidebar when a chat is selected on mobile
  };

  // 1. Auth + Fetch user + Persistent chats
  useEffect(() => {
    let isMounted = true;
    const initializeDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token || !storedUser?._id) {
          navigate("/");
          return;
        }

        const userId = String(storedUser._id); 
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const authRes = await axios.get(`http://localhost:5000/api/auth/verify/${userId}`, config);
        if (!isMounted) return;
        setCurrentUser(authRes.data);

        const chatRes = await axios.get(`http://localhost:5000/api/chats/${userId}`, config);
        const normalizedChats = chatRes.data.map((chat) => ({
            _id: String(chat._id),
            name: chat.name || "Unknown User",
            lastMsg: chat.lastMsg || chat.lastMessage || "",
            lastMessageTime: chat.lastMessageTime || null,
            online: false, 
            isGroup: false,
        }));

        if (isMounted) setChatList(normalizedChats);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/");
        }
      }
    };
    initializeDashboard();
    return () => { isMounted = false; };
  }, [navigate]);

  // 2. Global real-time updates
  useEffect(() => {
    if (!socket || !currentUser) return;
    const myId = String(currentUser._id || currentUser.id);

    const handleReceiveMessage = (data) => {
      if (String(data.receiverId) !== myId) return;
      const senderId = String(data.senderId);

      setChatList((prev) => {
        const existsIndex = prev.findIndex((c) => String(c._id || c.id) === senderId);
        if (existsIndex !== -1) {
          const updated = [...prev];
          updated[existsIndex] = {
            ...updated[existsIndex],
            lastMsg: data.text,
            lastMessageTime: new Date(),
          };
          return updated;
        }
        return [{
          _id: senderId,
          name: data.senderName || "Unknown",
          lastMsg: data.text,
          online: true,
          isGroup: false,
          lastMessageTime: new Date(),
        }, ...prev];
      });
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [socket, currentUser]);

  const activeChat = chatList.find((c) => String(c._id || c.id) === String(selectedChatId));

  return (
    // Changed bg-gray-100 to bg-deepdark to match Login background
    <div className="flex h-screen bg-deepdark overflow-hidden font-sans text-white">
      
      {/* Sidebar Responsive Container */}
      {/* Sidebar background is handled inside the Sidebar component, 
          but we ensure the container width is consistent */}
      <div className={`${showSidebar ? 'block w-full' : 'hidden'} md:block md:w-80 h-full flex-shrink-0 border-r border-white/5`}>
        <Sidebar
          chatList={chatList}
          setChatList={setChatList}
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChatId}
          currentUser={currentUser}
        />
      </div>

      {/* Chat Window Responsive Container */}
      {/* Changed bg-white to bg-deepdark for a seamless look */}
      <div className={`${!showSidebar ? 'block w-full' : 'hidden'} md:flex flex-1 flex-col min-w-0 bg-deepdark`}>
        {activeChat ? (
          <ChatWindow
            key={selectedChatId}
            chat={activeChat}
            currentUser={currentUser}
            setChatList={setChatList}
            onBack={() => setShowSidebar(true)} 
          />
        ) : (
          /* Empty State Section */
          /* Changed bg-gray-50 to bg-deepdark and text colors to gray-500 */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-deepdark text-gray-500">
            {/* Icon Container with darkpurple surface */}
            <div className="p-6 rounded-full bg-darkpurple mb-4 shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-vibrantpurple/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to your Chat</h2>
            <p className="text-gray-400">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;