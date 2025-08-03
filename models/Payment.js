const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  // Payment details
  paymentId: { type: String, required: true, unique: true }, // Custom payment ID like PAY123456
  transactionId: { type: String }, // External payment gateway transaction ID
  
  // Relationships
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who paid
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who receives
  
  // Amount details
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  platformFee: { type: Number, default: 0 },
  freelancerAmount: { type: Number, required: true }, // Amount after platform fee
  
  // Payment method
  paymentMethod: { 
    type: String, 
    enum: ["credit_card", "debit_card", "upi", "net_banking", "wallet", "bank_transfer"],
    required: true 
  },
  paymentGateway: { type: String }, // Razorpay, Stripe, etc.
  
  // Payment status
  status: { 
    type: String, 
    enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
    default: "pending"
  },
  
  // Timeline
  paymentDate: { type: Date, default: Date.now },
  processedDate: { type: Date },
  completedDate: { type: Date },
  
  // Escrow and release
  isEscrowed: { type: Boolean, default: true },
  escrowReleaseDate: { type: Date },
  escrowReleased: { type: Boolean, default: false },
  
  // Refund information
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String },
  refundDate: { type: Date },
  
  // Payment gateway response
  gatewayResponse: {
    success: Boolean,
    message: String,
    code: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Billing information
  billingDetails: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  
  // Withdrawal information (for freelancer payouts)
  withdrawal: {
    method: { type: String, enum: ["bank_transfer", "upi", "paypal"] },
    accountDetails: mongoose.Schema.Types.Mixed,
    processedDate: Date,
    status: { type: String, enum: ["pending", "processing", "completed", "failed"] }
  },
  
  // Dispute information
  isDisputed: { type: Boolean, default: false },
  disputeReason: { type: String },
  disputeDate: { type: Date },
  
  // Notes
  notes: { type: String },
  
}, { timestamps: true });

// Indexes for better query performance
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ client: 1, createdAt: -1 });
PaymentSchema.index({ freelancer: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: -1 });

// Generate payment ID before saving
PaymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.paymentId = `PAY${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model("Payment", PaymentSchema); 