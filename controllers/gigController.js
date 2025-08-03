
const Gig = require("../models/Gig");
const User = require("../models/User");

// Create a new gig
const createGig = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      price,
      priceType,
      minPrice,
      maxPrice,
      tags,
      deliveryTime,
      revisions,
      images,
      video
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !price || !deliveryTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create new gig
    const newGig = new Gig({
      title,
      description,
      category,
      subcategory,
      price,
      priceType: priceType || "fixed",
      minPrice,
      maxPrice,
      tags: tags || [],
      deliveryTime,
      revisions: revisions || 0,
      images: images || [],
      video,
      freelancer: req.user.id,
      status: "draft" // Start as draft
    });

    const savedGig = await newGig.save();

    // Populate freelancer details
    await savedGig.populate("freelancer", "name email profilePicture");

    res.status(201).json({
      success: true,
      message: "Gig created successfully",
      gig: savedGig
    });

  } catch (error) {
    console.error("Error creating gig:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all gigs for a freelancer
const getFreelancerGigs = async (req, res) => {
  try {
    const { status, category, search, sort, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { freelancer: req.user.id };
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
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
      case "price_high":
        sortOptions = { price: -1 };
        break;
      case "price_low":
        sortOptions = { price: 1 };
        break;
      case "orders":
        sortOptions = { orders: -1 };
        break;
      case "rating":
        sortOptions = { rating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const gigs = await Gig.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("freelancer", "name email profilePicture");

    const total = await Gig.countDocuments(query);

    res.json({
      success: true,
      gigs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalGigs: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching gigs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single gig by ID
const getGigById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const gig = await Gig.findById(id)
      .populate("freelancer", "name email profilePicture bio skills languages hourlyRate averageRating totalReviews")
      .populate({
        path: "reviews",
        populate: {
          path: "client",
          select: "name profilePicture"
        }
      });

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Check if user owns this gig or is admin
    if (gig.freelancer._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      success: true,
      gig
    });

  } catch (error) {
    console.error("Error fetching gig:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a gig
const updateGig = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const gig = await Gig.findById(id);
    
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Check ownership
    if (gig.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update gig
    const updatedGig = await Gig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("freelancer", "name email profilePicture");

    res.json({
      success: true,
      message: "Gig updated successfully",
      gig: updatedGig
    });

  } catch (error) {
    console.error("Error updating gig:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a gig
const deleteGig = async (req, res) => {
  try {
    const { id } = req.params;

    const gig = await Gig.findById(id);
    
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Check ownership
    if (gig.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if gig has active orders
    // TODO: Add order check here

    await Gig.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Gig deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting gig:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update gig status
const updateGigStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "paused", "draft"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const gig = await Gig.findById(id);
    
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Check ownership
    if (gig.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    gig.status = status;
    await gig.save();

    res.json({
      success: true,
      message: "Gig status updated successfully",
      gig
    });

  } catch (error) {
    console.error("Error updating gig status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get gig statistics
const getGigStats = async (req, res) => {
  try {
    const freelancerId = req.user.id;

    const stats = await Gig.aggregate([
      { $match: { freelancer: freelancerId } },
      {
        $group: {
          _id: null,
          totalGigs: { $sum: 1 },
          activeGigs: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          pausedGigs: { $sum: { $cond: [{ $eq: ["$status", "paused"] }, 1, 0] } },
          draftGigs: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
          totalViews: { $sum: "$views" },
          totalClicks: { $sum: "$clicks" },
          totalOrders: { $sum: "$orders" },
          averageRating: { $avg: "$rating" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalGigs: 0,
        activeGigs: 0,
        pausedGigs: 0,
        draftGigs: 0,
        totalViews: 0,
        totalClicks: 0,
        totalOrders: 0,
        averageRating: 0
      }
    });

  } catch (error) {
    console.error("Error fetching gig stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createGig,
  getFreelancerGigs,
  getGigById,
  updateGig,
  deleteGig,
  updateGigStatus,
  getGigStats
}; 