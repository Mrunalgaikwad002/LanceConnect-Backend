const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getUserPayments,
  getPaymentById,
  createPayment,
  processPayment,
  getPaymentStats,
  createWithdrawal,
  getWithdrawals,
  getWithdrawalStats,
} = require("../controllers/paymentController");

// Get user payments
router.get("/", auth, getUserPayments);
// Get payment statistics
router.get("/stats", auth, getPaymentStats);
// Get single payment
router.get("/:id", auth, getPaymentById);
// Create payment (for clients)
router.post("/", auth, createPayment);
// Process payment
router.post("/:id/process", auth, processPayment);

// Withdrawal routes
// Get withdrawals
router.get("/withdrawals", auth, getWithdrawals);
// Get withdrawal statistics
router.get("/withdrawals/stats", auth, getWithdrawalStats);
// Create withdrawal (for freelancers)
router.post("/withdrawals", auth, createWithdrawal);

module.exports = router; 