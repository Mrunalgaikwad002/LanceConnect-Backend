const Gig = require("../models/Gig");

// Create a new gig
const createGig = async (req, res) => {
  try {
    const { title, desc, price, category, images } = req.body;
    const gig = new Gig({
      title,
      desc,
      price,
      category,
      images,
      user: req.user.id, // from auth middleware
    });
    await gig.save();
    res.status(201).json(gig);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Get all gigs
const getGigs = async (req, res) => {
  try {
    const gigs = await Gig.find().populate("user", "name email");
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Get a single gig by ID
const getGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate("user", "name email");
    if (!gig) return res.status(404).json({ msg: "Gig not found" });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Update a gig
const updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ msg: "Gig not found" });
    if (gig.user.toString() !== req.user.id) return res.status(401).json({ msg: "Not authorized" });
    const { title, desc, price, category, images } = req.body;
    gig.title = title || gig.title;
    gig.desc = desc || gig.desc;
    gig.price = price || gig.price;
    gig.category = category || gig.category;
    gig.images = images || gig.images;
    await gig.save();
    res.json(gig);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete a gig
const deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ msg: "Gig not found" });
    if (gig.user.toString() !== req.user.id) return res.status(401).json({ msg: "Not authorized" });
    await gig.remove();
    res.json({ msg: "Gig deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  createGig,
  getGigs,
  getGig,
  updateGig,
  deleteGig,
}; 