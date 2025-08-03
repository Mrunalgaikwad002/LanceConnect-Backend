const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  // Review content
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true, maxlength: 1000 },
  
  // Relationships
  gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who wrote the review
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who received the review
  
  // Freelancer reply
  freelancerReply: { type: String, maxlength: 500 },
  replyDate: { type: Date },
  
  // Review status
  status: { type: String, enum: ["active", "hidden", "reported"], default: "active" },
  
  // Attachments (screenshots, etc.)
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  
  // Review categories (optional)
  categories: [{
    category: { type: String, enum: ["communication", "quality", "value", "delivery", "professionalism"] },
    rating: { type: Number, min: 1, max: 5 }
  }],
  
  // Helpful votes
  helpfulVotes: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  
  // Verification
  isVerified: { type: Boolean, default: false }, // Review from verified purchase
  
}, { timestamps: true });

// Indexes for better query performance
ReviewSchema.index({ gig: 1, createdAt: -1 });
ReviewSchema.index({ freelancer: 1, createdAt: -1 });
ReviewSchema.index({ client: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });

module.exports = mongoose.model("Review", ReviewSchema); 