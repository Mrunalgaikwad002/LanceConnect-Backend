const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getFreelancerOrders,
  getClientOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  addOrderMessage,
  cancelOrder,
  getOrderStats,
} = require("../controllers/orderController");

// Get orders for freelancer
router.get("/freelancer", auth, getFreelancerOrders);
// Get orders for client
router.get("/client", auth, getClientOrders);
// Get order statistics
router.get("/stats", auth, getOrderStats);
// Get single order
router.get("/:id", auth, getOrderById);
// Create order (for clients)
router.post("/", auth, createOrder);
// Update order status (for freelancers)
router.patch("/:id/status", auth, updateOrderStatus);
// Add message to order
router.post("/:id/message", auth, addOrderMessage);
// Cancel order
router.patch("/:id/cancel", auth, cancelOrder);

module.exports = router; 