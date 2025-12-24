import React, { useState, useEffect } from "react";
import Profilepic from "../Components/Profilepic";
import ChatItem from "./ChatItem";
import AddChat from "./AddChat";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const Sidebar = ({
  onSelectChat,
  selectedChatId,
  currentUser,
  chatList,      
  setChatList    
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onlineIds, setOnlineIds] = useState([]);
  const socket = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  // EFFECT 1: Socket Listeners & Re-joining Room
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (ids) => {
      console.log("Sidebar: Received online IDs", ids);
      setOnlineIds(ids);
      
      // Update the current list immediately when the server broadcasts
      setChatList((prev) =>
        prev.map((chat) => ({
          ...chat,
          online: ids.includes(String(chat._id || chat.id))
        }))
      );
    };

    const handleNewChat = (newChat) => {
      setChatList((prev) => {
        const exists = prev.some(
          (c) => String(c._id || c.id) === String(newChat._id)
        );

        if (exists) {
          return prev.map((chat) =>
            String(chat._id || chat.id) === String(newChat._id)
              ? { ...chat, lastMsg: newChat.lastMsg, online: newChat.online, lastMessageTime: newChat.lastMessageTime }
              : chat
          );
        }
        return [newChat, ...prev];
      });
    };

    // Re-join room for presence sync on mount/refresh
    const currentUserId = currentUser?._id || currentUser?.id;
    if (currentUserId) {
      socket.emit("join_room", currentUserId);
    }

    socket.on("get_online_users", handleOnlineUsers);
    socket.on("new_chat_started", handleNewChat);

    return () => {
      socket.off("get_online_users", handleOnlineUsers);
      socket.off("new_chat_started", handleNewChat);
    };
  }, [socket, currentUser, setChatList]);

  // EFFECT 2: Sync-on-Load
  // Ensures that when the database fetch finishes, we immediately check 
  // against the onlineIds we received from the socket.
  useEffect(() => {
    if (onlineIds.length > 0 && chatList.length > 0) {
      setChatList((prev) =>
        prev.map((chat) => {
          const isOnline = onlineIds.includes(String(chat._id || chat.id));
          return chat.online !== isOnline ? { ...chat, online: isOnline } : chat;
        })
      );
    }
  }, [onlineIds, chatList.length, setChatList]);

  const handleUserFound = (user) => {
    const userId = String(user._id || user.id);
    const exists = chatList.find((c) => String(c._id || c.id) === userId);

    if (!exists) {
      const newChat = {
        _id: userId,
        name: user.name || "Unknown User",
        lastMsg: "No messages yet",
        online: onlineIds.includes(userId),
        isGroup: false,
      };
      setChatList((prev) => [newChat, ...prev]);
      onSelectChat(newChat);
    } else {
      onSelectChat(exists);
    }
    setIsModalOpen(false);
  };

  return (
    // Replaced bg-white with bg-deepdark
    // Replaced border-gray-200 with border-white/5
    <div className="w-full md:w-80 h-full flex flex-col bg-deepdark border-r border-white/5 shadow-xl z-10">
      
      {/* User Header - Replaced bg-indigo-700 with bg-darkpurple */}
      <div className="p-4 bg-darkpurple text-white flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-3 overflow-hidden">
          <Profilepic
            name={currentUser?.name || "Me"}
            online={true}
          />
          <span className="font-bold truncate max-w-[120px]">
            {currentUser?.name || "User"}
          </span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-lightdark rounded-full transition-colors text-gray-400 hover:text-white"
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Label Section - Replaced bg-gray-50 with bg-deepdark */}
      <div className="p-3 bg-deepdark border-b border-white/5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages</h3>
      </div>

      {/* Chat List Area */}
      <div className="flex-1 overflow-y-auto relative bg-deepdark">
        {chatList.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm italic">
            No conversations yet. Start one!
          </div>
        ) : (
          chatList.map((chat) => (
            <ChatItem
              key={String(chat._id || chat.id)}
              chat={chat}
              active={String(selectedChatId) === String(chat._id || chat.id)}
              onClick={() => onSelectChat(chat)}
            />
          ))
        )}

        {/* Floating New Chat Button - Replaced bg-indigo-600 with bg-vibrantpurple */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-vibrantpurple text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 hover:bg-[#6b55e6] transition-all active:scale-95 z-20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <AddChat
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserFound={handleUserFound}
      />
    </div>
  );
};

export default Sidebar;