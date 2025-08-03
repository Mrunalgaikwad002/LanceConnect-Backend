const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  // Message content
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ["text", "file", "image", "document", "system"],
    default: "text"
  },
  
  // Relationships
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Message status
  status: { 
    type: String, 
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    thumbnail: String
  }],
  
  // Message metadata
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  originalContent: { type: String },
  
  // System messages (order updates, etc.)
  systemMessage: {
    type: { type: String, enum: ["order_status", "payment", "delivery", "review"] },
    data: mongoose.Schema.Types.Mixed
  },
  
  // Reply to another message
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  
  // Message reactions
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emoji: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Deletion
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  
}, { timestamps: true });

// Indexes for better query performance
MessageSchema.index({ order: 1, createdAt: 1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, createdAt: -1 });
MessageSchema.index({ status: 1 });

module.exports = mongoose.model("Message", MessageSchema); 