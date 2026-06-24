// backend/middleware/rbacMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "nitish_secret";

// Role hierarchy levels
const ROLE_LEVELS = {
  owner: 5,
  admin: 4,
  manager: 3,
  staff: 2,
  customer: 1
};

// =====================
// Core Authentication
// =====================

// Verify JWT token and attach user to request
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, no token provided" 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ 
      success: false,
      message: "Token invalid or expired" 
    });
  }
};

// Load full user data (optional - use when you need complete user object)
const loadUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated" 
      });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: "Account is blocked" 
      });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error("Load user error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Error loading user data" 
    });
  }
};

// =====================
// Role-Based Access
// =====================

// Require specific roles (array or single role)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const userRole = req.user.role;
    const userLevel = ROLE_LEVELS[userRole] || 0;

    // Check if user's role is in allowed roles
    const hasAccess = allowedRoles.some(role => {
      const roleLevel = ROLE_LEVELS[role];
      return userLevel >= roleLevel;
    });

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}` 
      });
    }

    next();
  };
};

// Shortcut middleware for different role levels
const ownerOnly = requireRole("owner");
const adminAndAbove = requireRole("admin");
const managerAndAbove = requireRole("manager");
const staffAndAbove = requireRole("staff");

// =====================
// Permission-Based Access
// =====================

// Require specific permissions
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false,
          message: "Authentication required" 
        });
      }

      // If user role is owner, grant all permissions
      if (req.user.role === "owner") {
        return next();
      }

      // Load user with permissions
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "User not found" 
        });
      }

      // Check each required permission
      const hasAllPermissions = requiredPermissions.every(permission => 
        user.hasPermission(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ 
          success: false,
          message: `Access denied. Required permissions: ${requiredPermissions.join(", ")}` 
        });
      }

      // Attach full user to request for downstream use
      req.user = user;
      next();
    } catch (err) {
      console.error("Permission check error:", err);
      return res.status(500).json({ 
        success: false,
        message: "Error checking permissions" 
      });
    }
  };
};

// =====================
// User Management Helpers
// =====================

// Check if user can manage another user (based on role hierarchy)
const canManageUser = (currentUser, targetUserId) => {
  // For owner - can manage everyone
  if (currentUser.role === "owner") return true;
  
  // For admin - can manage everyone except owner
  if (currentUser.role === "admin" && targetUserId.role !== "owner") return true;
  
  // For manager - can only manage staff and customers
  if (currentUser.role === "manager" && 
      ["staff", "customer"].includes(targetUserId.role)) return true;
  
  return false;
};

// Middleware to check if current user can manage target user
const canManageTargetUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    
    if (!targetUserId) {
      return next(); // No target user, continue
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        message: "Target user not found" 
      });
    }

    // Check if current user can manage target user
    if (!req.user.canManageUser(targetUser)) {
      return res.status(403).json({ 
        success: false,
        message: "You don't have permission to manage this user" 
      });
    }

    req.targetUser = targetUser;
    next();
  } catch (err) {
    console.error("Can manage user check error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Error checking user permissions" 
    });
  }
};

// =====================
// Combined Middleware
// =====================

// Full auth - authenticate + load user + check role
const auth = (...allowedRoles) => {
  return [authenticate, loadUser, requireRole(...allowedRoles)];
};

// Auth with permissions
const authWithPermissions = (...requiredPermissions) => {
  return [authenticate, loadUser, requirePermission(...requiredPermissions)];
};

// =====================
// Export
// =====================

module.exports = {
  // Core
  authenticate,
  loadUser,
  
  // Role-based
  requireRole,
  ownerOnly,
  adminAndAbove,
  managerAndAbove,
  staffAndAbove,
  
  // Permission-based
  requirePermission,
  
  // User management
  canManageUser,
  canManageTargetUser,
  
  // Combined
  auth,
  authWithPermissions,
  
  // Helpers
  ROLE_LEVELS
};
