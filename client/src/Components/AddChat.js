import React, { useState } from "react";
import axios from "axios";

const AddChat = ({ isOpen, onClose, onUserFound }) => {
  const [phno, setPhno] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Backend call to find user by phone number
      const res = await axios.post("http://localhost:5000/api/auth/find-user", { phno });
      
      // If user found, pass data back to parent (Sidebar/Dashboard)
      onUserFound(res.data);
      setPhno("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "User not found with this number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop updated to use deepdark with opacity
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deepdark/80 backdrop-blur-sm p-4">
      
      {/* Modal Container updated to darkpurple */}
      <div className="bg-darkpurple w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-white/5">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">New Chat</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Enter Phone Number
            </label>
            <input
              type="text"
              // Input styled with lightdark background and vibrantpurple focus ring
              className="w-full bg-lightdark px-4 py-2 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-vibrantpurple outline-none transition-all"
              placeholder="e.g. 919876543210"
              value={phno}
              onChange={(e) => setPhno(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            // Button updated to vibrantpurple
            className={`w-full py-2.5 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
              loading 
                ? "bg-gray-600 cursor-not-allowed" 
                : "bg-vibrantpurple hover:bg-[#6b55e6]"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : "Start Chat"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddChat;