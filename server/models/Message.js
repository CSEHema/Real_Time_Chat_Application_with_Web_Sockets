const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  
  // Changed to false because a message can be just an image/video
  text: { type: String, required: false }, 
  
  // New fields for media support
  mediaUrl: { type: String, default: null }, 
  mediaType: { type: String, default: null }, // e.g., 'image/jpeg' or 'video/mp4'
  
  time: { type: String, required: true },
  timestamp: { type: Date, default: Date.now } // Used for sorting history
});

module.exports = mongoose.model('Message', MessageSchema);