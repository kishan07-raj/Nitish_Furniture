const express = require("express");
const { protect, adminOnly, ownerOnly } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// GET /api/admin/users - Get all users with pagination
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    const query = {};
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ success: false, message: "Could not fetch users" });
  }
});

// GET /api/admin/users/:id - Get single user
router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error("Admin user detail error:", err);
    res.status(500).json({ success: false, message: "Could not fetch user" });
  }
});

// PUT /api/admin/users/:id/role - Update user role or block status
router.put("/:id/role", protect, adminOnly, async (req, res) => {
  try {
    const { role, isBlocked } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent owner from being modified
    if (user.role === 'owner') {
      return res.status(403).json({ success: false, message: "Cannot modify owner role" });
    }

    // Only owner can assign owner role
    if (role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: "Only owner can assign owner role" });
    }

    if (role) user.role = role;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;
    
    const saved = await user.save();

    res.json({
      success: true,
      user: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        role: saved.role,
        phone: saved.phone,
        isBlocked: saved.isBlocked
      }
    });
  } catch (err) {
    console.error("Admin update user role error:", err);
    res.status(500).json({ success: false, message: "Could not update user role" });
  }
});

// DELETE /api/admin/users/:id - Delete user (owner only)
router.delete("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent owner from being deleted
    if (user.role === 'owner') {
      return res.status(403).json({ success: false, message: "Cannot delete owner" });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete yourself" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ success: false, message: "Could not delete user" });
  }
});

module.exports = router;
