const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Middleware to check if user is blocked
const checkBlocked = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: "Your account is blocked. Please contact support." 
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DEBUG: Get all users with wishlists (admin only)
router.get("/debug/all", protect, async (req, res) => {
  try {
    console.log("[WISHLIST DEBUG] /api/wishlist/debug/all HIT");
    console.log("[WISHLIST DEBUG] User ID:", req.user.id);
    
    const users = await User.find({ wishlist: { $exists: true, $ne: [] } })
      .select("name email wishlist")
      .populate("wishlist", "name basePrice");
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/wishlist - Get user's wishlist
router.get("/", protect, async (req, res) => {
  try {
    console.log("[WISHLIST] GET /api/wishlist HIT");
    console.log("[WISHLIST] User ID:", req.user.id);
    
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'category' }
    });
    
    if (!user) {
      console.log("[WISHLIST] User not found:", req.user.id);
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    console.log("[WISHLIST] Found wishlist items:", user.wishlist.length);
    
    // Return in consistent format
    res.json({
      success: true,
      wishlist: user.wishlist || [],
      count: user.wishlist.length
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/wishlist/toggle - Toggle product in wishlist (add if not exists, remove if exists)
router.post("/toggle", protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required", success: false });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found", success: false });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // Check if product is already in wishlist
    const existingIndex = user.wishlist.findIndex(
      id => id.toString() === productId
    );

    let isWishlisted = false;

    if (existingIndex > -1) {
      // Product exists - remove it
      user.wishlist.splice(existingIndex, 1);
      isWishlisted = false;
    } else {
      // Product not exists - add it
      user.wishlist.push(productId);
      isWishlisted = true;
    }

    await user.save();
    
    // Populate for response
    await user.populate('wishlist');

    res.json({ 
      success: true, 
      message: isWishlisted ? "Product added to wishlist" : "Product removed from wishlist",
      isWishlisted,
      wishlist: user.wishlist,
      count: user.wishlist.length
    });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
});

// POST /api/wishlist/add - Add product to wishlist (legacy - use toggle instead)
router.post("/add", protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required", success: false });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found", success: false });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist", success: false });
    }

    user.wishlist.push(productId);
    await user.save();

    res.json({ 
      message: "Product added to wishlist", 
      success: true,
      wishlist: user.wishlist,
      count: user.wishlist.length
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
});

// DELETE /api/wishlist/remove/:productId - Remove product from wishlist
router.delete("/remove/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const index = user.wishlist.indexOf(productId);
    if (index === -1) {
      return res.status(404).json({ message: "Product not in wishlist" });
    }

    user.wishlist.splice(index, 1);
    await user.save();

    res.json({ message: "Product removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
