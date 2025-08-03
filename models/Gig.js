const mongoose = require("mongoose");

const GigSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  
  // Pricing
  price: { type: Number, required: true },
  priceType: { type: String, enum: ["fixed", "hourly"], default: "fixed" },
  minPrice: { type: Number },
  maxPrice: { type: Number },
  
  // Gig details
  tags: [{ type: String }],
  images: [{ type: String }], // Array of image URLs or paths
  video: { type: String }, // Video URL
  
  // Delivery settings
  deliveryTime: { type: Number, required: true }, // in days
  revisions: { type: Number, default: 0 },
  
  // Gig status
  status: { type: String, enum: ["active", "paused", "draft"], default: "draft" },
  
  // Freelancer reference
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Statistics
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  
  // SEO and visibility
  isFeatured: { type: Boolean, default: false },
  isPromoted: { type: Boolean, default: false },
  
}, { timestamps: true });

// Index for better search performance
GigSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model("Gig", GigSchema); 