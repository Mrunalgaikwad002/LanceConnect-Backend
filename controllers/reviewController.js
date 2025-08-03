const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");
const Gig = require("../models/Gig");

// Get all reviews for a freelancer
const getFreelancerReviews = async (req, res) => {
  try {
    const { rating, gig, search, sort, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { freelancer: req.user.id, status: "active" };
    
    if (rating && rating !== "all") {
      query.rating = parseInt(rating);
    }
    
    if (gig && gig !== "all") {
      query.gig = gig;
    }
    
    if (search) {
      query.$or = [
        { reviewText: { $regex: search, $options: "i" } },
        { freelancerReply: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "rating_high":
        sortOptions = { rating: -1 };
        break;
      case "rating_low":
        sortOptions = { rating: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("client", "name email profilePicture")
      .populate("gig", "title category")
      .populate("order", "orderId");

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single review by ID
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id)
      .populate("client", "name email profilePicture")
      .populate("gig", "title category")
      .populate("order", "orderId")
      .populate("freelancer", "name email profilePicture");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user owns this review or is the freelancer
    if (review.freelancer._id.toString() !== req.user.id && 
        review.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      success: true,
      review
    });

  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new review (for clients)
const createReview = async (req, res) => {
  try {
    const { orderId, rating, reviewText, categories, attachments } = req.body;

    // Validate required fields
    if (!orderId || !rating || !reviewText) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if rating is valid
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Find the order
    const order = await Order.findOne({ orderId, client: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is completed
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed orders" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ order: order._id });
    if (existingReview) {
      return res.status(400).json({ message: "Review already exists for this order" });
    }

    // Create new review
    const newReview = new Review({
      rating,
      reviewText,
      gig: order.gig,
      order: order._id,
      client: req.user.id,
      freelancer: order.freelancer,
      categories: categories || [],
      attachments: attachments || []
    });

    const savedReview = await newReview.save();

    // Update order to mark as reviewed
    order.hasReview = true;
    order.review = savedReview._id;
    await order.save();

    // Update gig statistics
    await updateGigStats(order.gig);

    // Update freelancer statistics
    await updateFreelancerStats(order.freelancer);

    // Populate the saved review
    await savedReview.populate([
      { path: "client", select: "name email profilePicture" },
      { path: "gig", select: "title category" },
      { path: "order", select: "orderId" }
    ]);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: savedReview
    });

  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add freelancer reply to a review
const addFreelancerReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    if (!replyText || replyText.trim().length === 0) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    if (replyText.length > 500) {
      return res.status(400).json({ message: "Reply must be less than 500 characters" });
    }

    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if freelancer owns this review
    if (review.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if reply already exists
    if (review.freelancerReply) {
      return res.status(400).json({ message: "Reply already exists for this review" });
    }

    // Add reply
    review.freelancerReply = replyText.trim();
    review.replyDate = new Date();
    await review.save();

    // Populate the updated review
    await review.populate([
      { path: "client", select: "name email profilePicture" },
      { path: "gig", select: "title category" },
      { path: "order", select: "orderId" }
    ]);

    res.json({
      success: true,
      message: "Reply added successfully",
      review
    });

  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update freelancer reply
const updateFreelancerReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    if (!replyText || replyText.trim().length === 0) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    if (replyText.length > 500) {
      return res.status(400).json({ message: "Reply must be less than 500 characters" });
    }

    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if freelancer owns this review
    if (review.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if reply exists
    if (!review.freelancerReply) {
      return res.status(400).json({ message: "No reply exists to update" });
    }

    // Update reply
    review.freelancerReply = replyText.trim();
    review.replyDate = new Date();
    await review.save();

    // Populate the updated review
    await review.populate([
      { path: "client", select: "name email profilePicture" },
      { path: "gig", select: "title category" },
      { path: "order", select: "orderId" }
    ]);

    res.json({
      success: true,
      message: "Reply updated successfully",
      review
    });

  } catch (error) {
    console.error("Error updating reply:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get review statistics for freelancer
const getReviewStats = async (req, res) => {
  try {
    const freelancerId = req.user.id;

    const stats = await Review.aggregate([
      { $match: { freelancer: freelancerId, status: "active" } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          fiveStarReviews: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          fourStarReviews: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          threeStarReviews: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          twoStarReviews: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          oneStarReviews: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          reviewsWithReplies: { $sum: { $cond: [{ $ne: ["$freelancerReply", null] }, 1, 0] } }
        }
      }
    ]);

    // Get recent reviews
    const recentReviews = await Review.find({ freelancer: freelancerId, status: "active" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("client", "name profilePicture")
      .populate("gig", "title");

    res.json({
      success: true,
      stats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        fiveStarReviews: 0,
        fourStarReviews: 0,
        threeStarReviews: 0,
        twoStarReviews: 0,
        oneStarReviews: 0,
        reviewsWithReplies: 0
      },
      recentReviews
    });

  } catch (error) {
    console.error("Error fetching review stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to update gig statistics
const updateGigStats = async (gigId) => {
  try {
    const reviews = await Review.find({ gig: gigId, status: "active" });
    
    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await Gig.findByIdAndUpdate(gigId, {
        rating: Math.round(averageRating * 10) / 10,
        reviews: reviews.length
      });
    }
  } catch (error) {
    console.error("Error updating gig stats:", error);
  }
};

// Helper function to update freelancer statistics
const updateFreelancerStats = async (freelancerId) => {
  try {
    const reviews = await Review.find({ freelancer: freelancerId, status: "active" });
    
    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await User.findByIdAndUpdate(freelancerId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      });
    }
  } catch (error) {
    console.error("Error updating freelancer stats:", error);
  }
};

module.exports = {
  getFreelancerReviews,
  getReviewById,
  createReview,
  addFreelancerReply,
  updateFreelancerReply,
  getReviewStats
}; 