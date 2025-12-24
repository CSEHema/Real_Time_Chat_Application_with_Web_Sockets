import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (currentUser && (currentUser.id || currentUser._id) && token) {
      const userId = currentUser._id || currentUser.id;

      if (!socketRef.current) {
        const newSocket = io("http://localhost:5000", {
          auth: { token }, // Token passed here for io.use()
          transports: ["websocket"],
          reconnection: true,
        });

        newSocket.on("connect", () => {
          console.log("SocketContext: Connected successfully");
          newSocket.emit("join_room", userId);
        });

        newSocket.on("connect_error", (err) => {
          console.error("Socket Auth Error:", err.message);
          if (err.message.includes("Authentication error")) {
            // Force logout if token is rejected
            localStorage.clear();
            window.location.href = "/";
        }});

        socketRef.current = newSocket;
        setSocket(newSocket);
      }
    } else if (!currentUser && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [currentUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};