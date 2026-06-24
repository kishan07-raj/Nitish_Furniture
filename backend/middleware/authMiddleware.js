const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nitish_secret";

// Normal user + admin + deliveryPartner all allowed
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // { id, role }
    
    // Check if user is blocked - load full user to check
    const User = require("../models/User");
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: "Your account has been blocked. Please contact support.",
        code: "ACCOUNT_BLOCKED"
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact support.",
        code: "ACCOUNT_INACTIVE"
      });
    }
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: user.name
    };
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Admin and above (admin, manager, owner) - but not staff
const adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'manager', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

// Admin and above including delivery partner (for shared routes)
const adminAndAbove = (req, res, next) => {
  if (!req.user || !['admin', 'manager', 'owner', 'deliveryPartner'].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin or Delivery Partner access only" });
  }
  next();
};

// Owner only
const ownerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner access only" });
  }
  next();
};

// Manager and above (manager, owner)
const managerAndAbove = (req, res, next) => {
  if (!req.user || !['manager', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ message: "Manager access only" });
  }
  next();
};

// Delivery partner only
const deliveryPartnerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "deliveryPartner") {
    return res.status(403).json({ message: "Delivery partner access only" });
  }
  next();
};

module.exports = { protect, adminOnly, adminAndAbove, ownerOnly, managerAndAbove, deliveryPartnerOnly };
