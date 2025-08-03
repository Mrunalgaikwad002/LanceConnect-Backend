const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema({
  // Withdrawal details
  withdrawalId: { type: String, required: true, unique: true }, // Custom withdrawal ID like WTH123456
  
  // Relationships
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Amount details
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  processingFee: { type: Number, default: 0 },
  netAmount: { type: Number, required: true }, // Amount after processing fee
  
  // Withdrawal method
  method: { 
    type: String, 
    enum: ["bank_transfer", "upi", "paypal", "razorpay"],
    required: true 
  },
  
  // Account details (encrypted)
  accountDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String,
    upiId: String,
    paypalEmail: String
  },
  
  // Status
  status: { 
    type: String, 
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
    default: "pending"
  },
  
  // Timeline
  requestedDate: { type: Date, default: Date.now },
  processedDate: { type: Date },
  completedDate: { type: Date },
  
  // Processing details
  processingTime: { type: Number }, // in hours
  estimatedDelivery: { type: Date },
  
  // Gateway response
  gatewayResponse: {
    success: Boolean,
    message: String,
    transactionId: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Rejection details
  rejectionReason: { type: String },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectedAt: { type: Date },
  
  // Notes
  notes: { type: String },
  
  // Minimum withdrawal amount check
  meetsMinimumAmount: { type: Boolean, default: true },
  
}, { timestamps: true });

// Indexes for better query performance
WithdrawalSchema.index({ withdrawalId: 1 });
WithdrawalSchema.index({ freelancer: 1, createdAt: -1 });
WithdrawalSchema.index({ status: 1 });
WithdrawalSchema.index({ requestedDate: -1 });

// Generate withdrawal ID before saving
WithdrawalSchema.pre('save', function(next) {
  if (!this.withdrawalId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.withdrawalId = `WTH${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model("Withdrawal", WithdrawalSchema); 