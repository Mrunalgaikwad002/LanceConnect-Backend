const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getFreelancerReviews,
  getReviewById,
  createReview,
  addFreelancerReply,
  updateFreelancerReply,
  getReviewStats,
} = require("../controllers/reviewController");

// Get all reviews for freelancer
router.get("/freelancer", auth, getFreelancerReviews);
// Get review statistics
router.get("/stats", auth, getReviewStats);
// Get single review
router.get("/:id", auth, getReviewById);
// Create review (for clients)
router.post("/", auth, createReview);
// Add freelancer reply
router.post("/:id/reply", auth, addFreelancerReply);
// Update freelancer reply
router.put("/:id/reply", auth, updateFreelancerReply);

module.exports = router; 