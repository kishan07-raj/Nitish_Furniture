// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { ROLES } = require("../models/User");
const { authenticate, ownerOnly, adminAndAbove } = require("../middleware/rbacMiddleware");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "nitish_secret";
const JWT_EXPIRES_IN = "7d";

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

// Sanitize user object for response
const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
  isActive: user.isActive,
  isBlocked: user.isBlocked,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
});

// Get client info for audit
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress,
  userAgent: req.headers["user-agent"]
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email and password are required" 
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      phone,
      role: ROLES.CUSTOMER // Default role
    });
    
    const token = generateToken(user);

    // Log registration
    await AuditLog.log({
      user: user._id,
      action: "user_register",
      resource: "user",
      resourceId: user._id,
      details: { email: user.email },
      ...getClientInfo(req),
      status: "success"
    });

    res.status(201).json({
      success: true,
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Registration failed", err);
    res.status(500).json({ 
      success: false,
      message: "Registration failed" 
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      await AuditLog.log({
        user: user._id,
        action: "user_login",
        resource: "user",
        details: { reason: "Account blocked" },
        ...getClientInfo(req),
        status: "failed"
      });
      return res.status(403).json({ 
        success: false,
        message: "Account is blocked. Please contact support." 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      await AuditLog.log({
        user: user._id,
        action: "user_login",
        resource: "user",
        details: { reason: "Account deactivated" },
        ...getClientInfo(req),
        status: "failed"
      });
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact support." 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await AuditLog.log({
        user: user._id,
        action: "user_login",
        resource: "user",
        details: { reason: "Invalid password" },
        ...getClientInfo(req),
        status: "failed"
      });
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    // Log successful login
    await AuditLog.log({
      user: user._id,
      action: "user_login",
      resource: "user",
      resourceId: user._id,
      details: { role: user.role },
      ...getClientInfo(req),
      status: "success"
    });

    res.json({
      success: true,
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Login failed", err);
    res.status(500).json({ 
      success: false,
      message: "Login failed" 
    });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticate, async (req, res) => {
  try {
    // Log logout
    await AuditLog.log({
      user: req.user.id,
      action: "user_logout",
      resource: "user",
      ...getClientInfo(req),
      status: "success"
    });

    res.json({ 
      success: true,
      message: "Logged out successfully" 
    });
  } catch (err) {
    console.error("Logout failed", err);
    res.status(500).json({ 
      success: false,
      message: "Logout failed" 
    });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    res.json({ 
      success: true,
      user: toSafeUser(user) 
    });
  } catch (err) {
    console.error("Profile load failed", err);
    res.status(500).json({ 
      success: false,
      message: "Could not load profile" 
    });
  }
});

// GET /api/auth/admin/check
router.get("/admin/check", authenticate, adminAndAbove, (req, res) => {
  res.json({ 
    success: true,
    ok: true, 
    message: "Admin verified",
    role: req.user.role 
  });
});

// GET /api/auth/owner/check - Owner only
router.get("/owner/check", authenticate, ownerOnly, (req, res) => {
  res.json({ 
    success: true,
    ok: true, 
    message: "Owner verified",
    role: req.user.role 
  });
});

// GET /api/auth/permissions - Get current user's permissions
router.get("/permissions", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    res.json({ 
      success: true,
      role: user.role,
      permissions: user.getAllPermissions() 
    });
  } catch (err) {
    console.error("Permissions fetch failed", err);
    res.status(500).json({ 
      success: false,
      message: "Could not fetch permissions" 
    });
  }
});

// GET /api/auth/addresses
router.get("/addresses", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ 
      success: true,
      addresses: user.addresses || [] 
    });
  } catch (err) {
    console.error("Addresses fetch failed", err);
    res.status(500).json({ 
      success: false,
      message: "Could not fetch addresses" 
    });
  }
});

// POST /api/auth/addresses
router.post("/addresses", authenticate, async (req, res) => {
  try {
    const { type, street, city, state, zipCode, country } = req.body;
    
    if (!type || !street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ 
        success: false,
        message: "All address fields are required" 
      });
    }
    
    const user = await User.findById(req.user.id);
    user.addresses.push({ type, street, city, state, zipCode, country });
    await user.save();
    
    res.status(201).json({ 
      success: true,
      addresses: user.addresses 
    });
  } catch (err) {
    console.error("Address add failed", err);
    res.status(500).json({ 
      success: false,
      message: "Could not add address" 
    });
  }
});

// GET /api/auth/roles - Get available roles (owner only)
router.get("/roles", authenticate, ownerOnly, (req, res) => {
  res.json({
    success: true,
    roles: Object.values(ROLES)
  });
});

// PUT /api/auth/me - Update user profile
router.put("/me", authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Log profile update
    await AuditLog.log({
      user: user._id,
      action: "user_profile_update",
      resource: "user",
      resourceId: user._id,
      details: { updatedFields: Object.keys(req.body) },
      ...getClientInfo(req),
      status: "success"
    });

    res.json({ 
      success: true,
      user: toSafeUser(user) 
    });
  } catch (err) {
    console.error("Profile update failed", err);
    res.status(500).json({ 
      success: false,
      message: "Could not update profile" 
    });
  }
});

// PUT /api/auth/change-password - Change user password
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Current password and new password are required" 
      });
    }

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
      // Log failed password change attempt
      await AuditLog.log({
        user: user._id,
        action: "user_password_change",
        resource: "user",
        details: { reason: "Invalid current password" },
        ...getClientInfo(req),
        status: "failed"
      });
      
      return res.status(401).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log successful password change
    await AuditLog.log({
      user: user._id,
      action: "user_password_change",
      resource: "user",
      resourceId: user._id,
      ...getClientInfo(req),
      status: "success"
    });

    res.json({ 
      success: true,
      message: "Password changed successfully" 
    });
  } catch (err) {
    console.error("Password change failed", err);
    res.status(500).json({ 
      success: false,
      message: "Could not change password" 
    });
  }
});

module.exports = router;
