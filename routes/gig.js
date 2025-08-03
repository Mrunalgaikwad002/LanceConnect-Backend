const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/gigController");
console.log("GIG CONTROLLER:", controller);

const {
  createGig,
  getFreelancerGigs,
  getGigById,
  updateGig,
  deleteGig,
  updateGigStatus,
  getGigStats,
} = controller;

// Public: Get all gigs
router.get("/", getFreelancerGigs);
// Public: Get single gig
router.get("/:id", getGigById);
// Private: Create gig
router.post("/", auth, createGig);
// Private: Update gig
router.put("/:id", auth, updateGig);
// Private: Delete gig
router.delete("/:id", auth, deleteGig);
// Private: Update gig status
router.patch("/:id/status", auth, updateGigStatus);
// Private: Get gig statistics
router.get("/stats", auth, getGigStats);

module.exports = router; 