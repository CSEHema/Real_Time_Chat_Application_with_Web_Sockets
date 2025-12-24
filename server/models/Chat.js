const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({

  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: { type: String, default: "" },
  lastMessageTime: { type: Date },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ChatSchema.index({ participants: 1 });

// Automatically sort participants before saving to prevent duplicate chat documents
ChatSchema.pre('save', function(next) {
  if (this.isModified('participants')) {
    this.participants = this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
  next();
});

module.exports = mongoose.model('Chat', ChatSchema);