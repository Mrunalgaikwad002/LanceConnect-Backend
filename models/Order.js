const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  // Order details
  orderId: { type: String, required: true, unique: true }, // Custom order ID like ORD123456
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Relationships
  gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Pricing
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  platformFee: { type: Number, default: 0 },
  freelancerAmount: { type: Number, required: true }, // Amount after platform fee
  
  // Order status
  status: { 
    type: String, 
    enum: ["pending", "in_progress", "delivered", "completed", "cancelled", "disputed"],
    default: "pending"
  },
  
  // Timeline
  orderDate: { type: Date, default: Date.now },
  startDate: { type: Date },
  deliveryDate: { type: Date, required: true },
  completedDate: { type: Date },
  
  // Requirements and deliverables
  requirements: { type: String },
  deliverables: [{
    name: String,
    description: String,
    fileUrl: String,
    uploadedAt: Date
  }],
  
  // Revisions
  revisions: { type: Number, default: 0 },
  maxRevisions: { type: Number, default: 0 },
  
  // Communication
  messages: [{
    sender: { type: String, enum: ["client", "freelancer"] },
    message: String,
    attachments: [{
      name: String,
      url: String,
      type: String
    }],
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Payment status
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "refunded", "disputed"],
    default: "pending"
  },
  
  // Escrow and release
  isEscrowed: { type: Boolean, default: true },
  escrowReleased: { type: Boolean, default: false },
  escrowReleaseDate: { type: Date },
  
  // Cancellation
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ["client", "freelancer", "admin"] },
  cancellationDate: { type: Date },
  
  // Dispute
  isDisputed: { type: Boolean, default: false },
  disputeReason: { type: String },
  disputeDate: { type: Date },
  
  // Rating and review
  hasReview: { type: Boolean, default: false },
  review: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
  
}, { timestamps: true });

// Indexes for better query performance
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ client: 1, createdAt: -1 });
OrderSchema.index({ freelancer: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });

// Generate order ID before saving
OrderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderId = `ORD${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema); 