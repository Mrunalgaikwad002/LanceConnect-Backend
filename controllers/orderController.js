const Order = require("../models/Order");
const Gig = require("../models/Gig");
const User = require("../models/User");
const Payment = require("../models/Payment");

// Get all orders for a freelancer
const getFreelancerOrders = async (req, res) => {
  try {
    const { status, search, sort, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { freelancer: req.user.id };
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "newest":
        sortOptions = { orderDate: -1 };
        break;
      case "oldest":
        sortOptions = { orderDate: 1 };
        break;
      case "amount_high":
        sortOptions = { amount: -1 };
        break;
      case "amount_low":
        sortOptions = { amount: 1 };
        break;
      case "delivery_date":
        sortOptions = { deliveryDate: 1 };
        break;
      default:
        sortOptions = { orderDate: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("client", "name email profilePicture")
      .populate("gig", "title category images");

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all orders for a client
const getClientOrders = async (req, res) => {
  try {
    const { status, search, sort, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { client: req.user.id };
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "newest":
        sortOptions = { orderDate: -1 };
        break;
      case "oldest":
        sortOptions = { orderDate: 1 };
        break;
      case "amount_high":
        sortOptions = { amount: -1 };
        break;
      case "amount_low":
        sortOptions = { amount: 1 };
        break;
      case "delivery_date":
        sortOptions = { deliveryDate: 1 };
        break;
      default:
        sortOptions = { orderDate: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("freelancer", "name email profilePicture")
      .populate("gig", "title category images");

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate("client", "name email profilePicture")
      .populate("freelancer", "name email profilePicture bio")
      .populate("gig", "title category description images deliveryTime revisions")
      .populate("review", "rating reviewText");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user has access to this order
    if (order.client._id.toString() !== req.user.id && 
        order.freelancer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new order (for clients)
const createOrder = async (req, res) => {
  try {
    const { gigId, title, description, requirements, amount, deliveryDate } = req.body;

    // Validate required fields
    if (!gigId || !title || !description || !amount || !deliveryDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the gig
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Check if gig is active
    if (gig.status !== "active") {
      return res.status(400).json({ message: "Gig is not available for orders" });
    }

    // Calculate platform fee (example: 10%)
    const platformFee = amount * 0.10;
    const freelancerAmount = amount - platformFee;

    // Create new order
    const newOrder = new Order({
      title,
      description,
      requirements,
      gig: gigId,
      client: req.user.id,
      freelancer: gig.freelancer,
      amount,
      freelancerAmount,
      platformFee,
      deliveryDate: new Date(deliveryDate),
      maxRevisions: gig.revisions
    });

    const savedOrder = await newOrder.save();

    // Update gig order count
    await Gig.findByIdAndUpdate(gigId, { $inc: { orders: 1 } });

    // Populate the saved order
    await savedOrder.populate([
      { path: "client", select: "name email profilePicture" },
      { path: "freelancer", select: "name email profilePicture" },
      { path: "gig", select: "title category" }
    ]);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update order status (for freelancers)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliverables } = req.body;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if freelancer owns this order
    if (order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["in_progress", "cancelled"],
      in_progress: ["delivered", "cancelled"],
      delivered: ["completed", "disputed"],
      completed: [],
      cancelled: [],
      disputed: ["completed", "cancelled"]
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    // Update order
    order.status = status;
    
    if (status === "in_progress" && !order.startDate) {
      order.startDate = new Date();
    }
    
    if (status === "delivered" && deliverables) {
      order.deliverables = deliverables;
    }
    
    if (status === "completed") {
      order.completedDate = new Date();
    }

    await order.save();

    // Populate the updated order
    await order.populate([
      { path: "client", select: "name email profilePicture" },
      { path: "freelancer", select: "name email profilePicture" },
      { path: "gig", select: "title category" }
    ]);

    res.json({
      success: true,
      message: "Order status updated successfully",
      order
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add message to order
const addOrderMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is part of this order
    if (order.client.toString() !== req.user.id && 
        order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Determine sender role
    const sender = order.client.toString() === req.user.id ? "client" : "freelancer";

    // Add message
    order.messages.push({
      sender,
      message: message.trim(),
      attachments: attachments || [],
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: "Message added successfully",
      order
    });

  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user can cancel this order
    if (order.client.toString() !== req.user.id && 
        order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if order can be cancelled
    if (!["pending", "in_progress"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled in current status" });
    }

    // Update order
    order.status = "cancelled";
    order.cancellationReason = reason;
    order.cancelledBy = order.client.toString() === req.user.id ? "client" : "freelancer";
    order.cancellationDate = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order
    });

  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = userRole === "freelancer" ? { freelancer: userId } : { client: userId };

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          inProgressOrders: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalOrders: 0,
        pendingOrders: 0,
        inProgressOrders: 0,
        deliveredOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalAmount: 0,
        averageAmount: 0
      }
    });

  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getFreelancerOrders,
  getClientOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  addOrderMessage,
  cancelOrder,
  getOrderStats
}; 