import Profilepic from "../Components/Profilepic";

const ChatItem = ({ chat, active, onClick }) => {
  return (
    <div 
      onClick={onClick}
      // Replaced bg-white with bg-deepdark
      // Replaced hover:bg-green-50 with hover:bg-darkpurple
      // Replaced green active states with vibrantpurple highlights
      className={`flex items-center p-3 cursor-pointer transition-all border-b border-white/5 
      ${active 
        ? "bg-vibrantpurple/10 border-l-4 border-l-vibrantpurple" 
        : "bg-deepdark hover:bg-darkpurple"}`}
    >
      <Profilepic name={chat.name} online={chat.online} />
      
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          {/* Replaced text-gray-800 with white */}
          <h4 className="text-sm font-bold text-white truncate">
            {chat.name}
          </h4>
          
          {chat.lastMessageTime && (
            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
              {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        
        {/* Replaced text-gray-500 with text-gray-400 for better dark mode contrast */}
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {chat.lastMsg || chat.lastMessage || "No messages yet"}
        </p>
      </div>
    </div>
  );
};

export default ChatItem;