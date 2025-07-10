const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createGig,
  getGigs,
  getGig,
  updateGig,
  deleteGig,
} = require("../controllers/gigController");

// Public: Get all gigs
router.get("/", getGigs);
// Public: Get single gig
router.get("/:id", getGig);
// Private: Create gig
router.post("/", auth, createGig);
// Private: Update gig
router.put("/:id", auth, updateGig);
// Private: Delete gig
router.delete("/:id", auth, deleteGig);

module.exports = router; 