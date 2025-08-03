const Payment = require("../models/Payment");
const Order = require("../models/Order");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");

// Get all payments for a user
const getUserPayments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    // Build query based on user role
    const query = {};
    if (req.user.role === "freelancer") {
      query.freelancer = req.user.id;
    } else {
      query.client = req.user.id;
    }
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (type && type !== "all") {
      query.paymentMethod = type;
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(query)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("order", "orderId title")
      .populate("client", "name email")
      .populate("freelancer", "name email");

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id)
      .populate("order", "orderId title description")
      .populate("client", "name email profilePicture")
      .populate("freelancer", "name email profilePicture");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user has access to this payment
    if (payment.client._id.toString() !== req.user.id && 
        payment.freelancer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new payment (for clients)
const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, billingDetails } = req.body;

    // Validate required fields
    if (!orderId || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the order
    const order = await Order.findOne({ orderId, client: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ order: order._id });
    if (existingPayment) {
      return res.status(400).json({ message: "Payment already exists for this order" });
    }

    // Create new payment
    const newPayment = new Payment({
      order: order._id,
      client: req.user.id,
      freelancer: order.freelancer,
      amount: order.amount,
      freelancerAmount: order.freelancerAmount,
      platformFee: order.platformFee,
      paymentMethod,
      billingDetails: billingDetails || {},
      paymentGateway: "razorpay" // Default gateway
    });

    const savedPayment = await newPayment.save();

    // Update order payment status
    order.paymentStatus = "paid";
    await order.save();

    // Populate the saved payment
    await savedPayment.populate([
      { path: "order", select: "orderId title" },
      { path: "client", select: "name email" },
      { path: "freelancer", select: "name email" }
    ]);

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment: savedPayment
    });

  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Process payment (simulate payment gateway)
const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, gatewayResponse } = req.body;

    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if user owns this payment
    if (payment.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Simulate payment processing
    payment.status = "completed";
    payment.transactionId = transactionId;
    payment.processedDate = new Date();
    payment.completedDate = new Date();
    payment.gatewayResponse = gatewayResponse || {
      success: true,
      message: "Payment processed successfully",
      code: "SUCCESS"
    };

    await payment.save();

    // Update order status
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = "paid";
      await order.save();
    }

    res.json({
      success: true,
      message: "Payment processed successfully",
      payment
    });

  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = userRole === "freelancer" ? { freelancer: userId } : { client: userId };

    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          completedPayments: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          pendingPayments: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          failedPayments: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          averageAmount: { $avg: "$amount" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        averageAmount: 0
      }
    });

  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create withdrawal request (for freelancers)
const createWithdrawal = async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;

    // Validate required fields
    if (!amount || !method || !accountDetails) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check minimum withdrawal amount
    const minAmount = 500; // ₹500 minimum
    if (amount < minAmount) {
      return res.status(400).json({ message: `Minimum withdrawal amount is ₹${minAmount}` });
    }

    // Check if freelancer has enough balance
    const freelancer = await User.findById(req.user.id);
    if (freelancer.totalEarnings < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Calculate processing fee (example: 2%)
    const processingFee = amount * 0.02;
    const netAmount = amount - processingFee;

    // Create withdrawal request
    const newWithdrawal = new Withdrawal({
      freelancer: req.user.id,
      amount,
      netAmount,
      processingFee,
      method,
      accountDetails,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    });

    const savedWithdrawal = await newWithdrawal.save();

    // Update freelancer balance
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalEarnings: -amount }
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request created successfully",
      withdrawal: savedWithdrawal
    });

  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get withdrawal requests (for freelancers)
const getWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { freelancer: req.user.id };
    
    if (status && status !== "all") {
      query.status = status;
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    const withdrawals = await Withdrawal.find(query)
      .sort({ requestedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      withdrawals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalWithdrawals: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get withdrawal statistics
const getWithdrawalStats = async (req, res) => {
  try {
    const freelancerId = req.user.id;

    const stats = await Withdrawal.aggregate([
      { $match: { freelancer: freelancerId } },
      {
        $group: {
          _id: null,
          totalWithdrawals: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          completedWithdrawals: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          pendingWithdrawals: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          failedWithdrawals: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          totalFees: { $sum: "$processingFee" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalWithdrawals: 0,
        totalAmount: 0,
        completedWithdrawals: 0,
        pendingWithdrawals: 0,
        failedWithdrawals: 0,
        totalFees: 0
      }
    });

  } catch (error) {
    console.error("Error fetching withdrawal stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUserPayments,
  getPaymentById,
  createPayment,
  processPayment,
  getPaymentStats,
  createWithdrawal,
  getWithdrawals,
  getWithdrawalStats
}; 