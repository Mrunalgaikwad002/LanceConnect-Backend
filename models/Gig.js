const mongoose = require("mongoose");

const GigSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs or paths
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to freelancer
}, { timestamps: true });

module.exports = mongoose.model("Gig", GigSchema); 