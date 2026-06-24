const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { authenticate } = require("../middleware/rbacMiddleware");
const { 
  updateProfileValidation, 
  addressValidation, 
  addressIdValidation,
  userOrdersListValidation,
  changePasswordValidation,
  wishlistValidation
} = require("../middleware/validation");

const router = express.Router();

// Middleware to ensure user is authenticated
router.use(authenticate);

// ============================================
// GET /api/users/profile
// Get full user profile with addresses, stats
// ============================================
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Get order stats for profile
    const orderStats = await Order.getOrderStats(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        loyaltyPoints: user.loyaltyPoints || 0,
        totalSpent: user.totalSpent || 0,
        addresses: user.addresses || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        orderStats
      }
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch profile" 
    });
  }
});

// ============================================
// PUT /api/users/profile
// Update user profile (name, phone, avatar)
// ============================================
router.put("/profile", updateProfileValidation, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update fields
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update profile" 
    });
  }
});

// ============================================
// PUT /api/users/password
// Change user password
// ============================================
router.put("/password", changePasswordValidation, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select("+password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to change password" 
    });
  }
});

// ============================================
// GET /api/users/stats
// Get user order statistics
// ============================================
router.get("/stats", async (req, res) => {
  try {
    const orderStats = await Order.getOrderStats(req.user.id);
    
    res.json({
      success: true,
      stats: orderStats
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch stats" 
    });
  }
});

// ============================================
// POST /api/users/address
// Add new address
// ============================================
router.post("/address", addressValidation, async (req, res) => {
  try {
    const { fullName, phone, street, landmark, city, state, postalCode, country, addressType, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // If this is set as default, remove default from all other addresses
    if (isDefault) {
      user.addresses = user.addresses.map(addr => ({
        ...addr.toObject(),
        isDefault: false
      }));
    }

    // Add new address
    const newAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      landmark: landmark?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country?.trim() || "India",
      addressType: addressType || "Home",
      isDefault: isDefault || false
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses
    });
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to add address" 
    });
  }
});

// ============================================
// PUT /api/users/address/:id
// Update address
// ============================================
router.put("/address/:id", addressIdValidation, addressValidation, async (req, res) => {
  try {
    const { fullName, phone, street, landmark, city, state, postalCode, country, addressType, isDefault } = req.body;
    const addressId = req.params.id;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Find address index
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: "Address not found" 
      });
    }

    // If setting as default, remove default from all other addresses
    if (isDefault && !user.addresses[addressIndex].isDefault) {
      user.addresses = user.addresses.map(addr => ({
        ...addr.toObject(),
        isDefault: false
      }));
    }

    // Update address fields
    if (fullName !== undefined) user.addresses[addressIndex].fullName = fullName.trim();
    if (phone !== undefined) user.addresses[addressIndex].phone = phone.trim();
    if (street !== undefined) user.addresses[addressIndex].street = street.trim();
    if (landmark !== undefined) user.addresses[addressIndex].landmark = landmark.trim();
    if (city !== undefined) user.addresses[addressIndex].city = city.trim();
    if (state !== undefined) user.addresses[addressIndex].state = state.trim();
    if (postalCode !== undefined) user.addresses[addressIndex].postalCode = postalCode.trim();
    if (country !== undefined) user.addresses[addressIndex].country = country.trim();
    if (addressType !== undefined) user.addresses[addressIndex].addressType = addressType;
    if (isDefault !== undefined) user.addresses[addressIndex].isDefault = isDefault;

    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses
    });
  } catch (err) {
    console.error("Update address error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update address" 
    });
  }
});

// ============================================
// DELETE /api/users/address/:id
// Delete address
// ============================================
router.delete("/address/:id", addressIdValidation, async (req, res) => {
  try {
    const addressId = req.params.id;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if address exists
    const addressExists = user.addresses.some(
      addr => addr._id.toString() === addressId
    );

    if (!addressExists) {
      return res.status(404).json({ 
        success: false,
        message: "Address not found" 
      });
    }

    // Check if this was the default address
    const deletedAddress = user.addresses.find(
      addr => addr._id.toString() === addressId
    );
    const wasDefault = deletedAddress.isDefault;

    // Remove address
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== addressId
    );

    // If deleted address was default, set first remaining address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses
    });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete address" 
    });
  }
});

// ============================================
// PUT /api/users/address/:id/default
// Set address as default
// ============================================
router.put("/address/:id/default", addressIdValidation, async (req, res) => {
  try {
    const addressId = req.params.id;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Find address
    const addressExists = user.addresses.some(
      addr => addr._id.toString() === addressId
    );

    if (!addressExists) {
      return res.status(404).json({ 
        success: false,
        message: "Address not found" 
      });
    }

    // Remove default from all addresses
    user.addresses = user.addresses.map(addr => ({
      ...addr.toObject(),
      isDefault: addr._id.toString() === addressId
    }));

    await user.save();

    res.json({
      success: true,
      message: "Default address updated successfully",
      addresses: user.addresses
    });
  } catch (err) {
    console.error("Set default address error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to set default address" 
    });
  }
});

// ============================================
// GET /api/users/orders
// Get all orders for the logged in user with filters, pagination, search
// ============================================
router.get("/orders", userOrdersListValidation, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sort = "newest",
      search 
    } = req.query;

    // Build query
    const query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    // Search by order ID
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // newest first
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "price-high") sortOption = { grandTotal: -1 };
    if (sort === "price-low") sortOption = { grandTotal: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product")
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch orders" 
    });
  }
});

// ============================================
// GET /api/users/orders/:id
// Get single order details (only if user owns the order)
// ============================================
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Check if user owns the order
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this order" 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch order" 
    });
  }
});

// ============================================
// WISHLIST ROUTES (Inline)
// ============================================

// GET /api/users/wishlist
router.get("/wishlist", async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: "wishlist",
        populate: { path: "category" }
      });
    
    res.json({
      success: true,
      wishlist: user.wishlist || []
    });
  } catch (err) {
    console.error("Get wishlist error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch wishlist" 
    });
  }
});

// POST /api/users/wishlist/:productId
router.post("/wishlist/:productId", wishlistValidation, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }

    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ 
        success: false,
        message: "Product already in wishlist" 
      });
    }

    user.wishlist.push(productId);
    await user.save();

    res.json({
      success: true,
      message: "Product added to wishlist",
      wishlist: user.wishlist
    });
  } catch (err) {
    console.error("Add to wishlist error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to add to wishlist" 
    });
  }
});

// DELETE /api/users/wishlist/:productId
router.delete("/wishlist/:productId", wishlistValidation, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    user.wishlist = user.wishlist.filter(
      id => id.toString() !== productId
    );
    await user.save();

    res.json({
      success: true,
      message: "Product removed from wishlist",
      wishlist: user.wishlist
    });
  } catch (err) {
    console.error("Remove from wishlist error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove from wishlist" 
    });
  }
});

// ============================================
// RECENTLY VIEWED ROUTES
// ============================================

// GET /api/users/recently-viewed
router.get("/recently-viewed", async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: "recentlyViewed.product",
        populate: { path: "category" }
      })
      .select("recentlyViewed");
    
    // Sort by viewedAt and take last 20
    const recentlyViewed = (user.recentlyViewed || [])
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 20)
      .map(item => item.product);
    
    res.json({
      success: true,
      products: recentlyViewed
    });
  } catch (err) {
    console.error("Get recently viewed error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch recently viewed" 
    });
  }
});

// POST /api/users/recently-viewed/:productId
router.post("/recently-viewed/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Remove if already exists (will be added to front)
    user.recentlyViewed = user.recentlyViewed.filter(
      item => item.product.toString() !== productId
    );

    // Add to beginning
    user.recentlyViewed.unshift({
      product: productId,
      viewedAt: new Date()
    });

    // Keep only last 20
    if (user.recentlyViewed.length > 20) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 20);
    }

    await user.save();

    res.json({
      success: true,
      message: "Recently viewed updated"
    });
  } catch (err) {
    console.error("Add to recently viewed error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update recently viewed" 
    });
  }
});

module.exports = router;

