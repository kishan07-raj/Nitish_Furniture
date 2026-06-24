// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Role hierarchy: owner > admin > manager > staff > customer
const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  CUSTOMER: "customer"
};

// Address types
const ADDRESS_TYPES = {
  HOME: "Home",
  OFFICE: "Office",
  OTHER: "Other"
};

// Permission definitions for each role
const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    // All permissions
    "dashboard:view",
    "products:read", "products:create", "products:update", "products:delete", "products:bulk",
    "orders:read", "orders:update", "orders:delete", "orders:refund",
    "users:read", "users:create", "users:update", "users:delete", "users:roles",
    "inventory:read", "inventory:update",
    "finance:read", "finance:export",
    "cms:read", "cms:create", "cms:update", "cms:delete",
    "settings:read", "settings:update",
    "audit:read", "analytics:view", "staff:manage", "api_keys:manage", "backup:manage"
  ],
  [ROLES.ADMIN]: [
    "dashboard:view",
    "products:read", "products:create", "products:update", "products:delete", "products:bulk",
    "orders:read", "orders:update", "orders:delete", "orders:refund",
    "users:read", "users:create", "users:update", "users:delete",
    "inventory:read", "inventory:update",
    "finance:read", "finance:export",
    "cms:read", "cms:create", "cms:update", "cms:delete",
    "settings:read", "settings:update",
    "audit:read", "analytics:view"
  ],
  [ROLES.MANAGER]: [
    "dashboard:view",
    "products:read", "products:create", "products:update",
    "orders:read", "orders:update",
    "users:read",
    "inventory:read", "inventory:update",
    "cms:read", "cms:create", "cms:update",
    "analytics:view"
  ],
  [ROLES.STAFF]: [
    "dashboard:view",
    "products:read",
    "orders:read", "orders:update",
    "inventory:read",
    "cms:read"
  ],
  [ROLES.CUSTOMER]: [
    // No admin permissions
  ]
};

// Address sub-schema
const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: "India", trim: true },
  addressType: {
    type: String,
    enum: Object.values(ADDRESS_TYPES),
    default: ADDRESS_TYPES.HOME
  },
  isDefault: { type: Boolean, default: false },
  // Legacy fields for backward compatibility
  type: { type: String },
  zipCode: { type: String }
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true // Enterprise: Index for fast queries
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true // Enterprise: Index for role-based queries
    },
    isVerified: { type: Boolean, default: false }, // Enterprise: Email verification
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date },
    blockReason: { type: String },
    lastLogin: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    // Enterprise: Loyalty program
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    // Enterprise: Recently viewed products
    recentlyViewed: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      viewedAt: { type: Date, default: Date.now }
    }],
    // For staff/managers - permissions can be customized per user
    customPermissions: [{ type: String }],
    // Enterprise: Enhanced addresses with type
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    points: { type: Number, default: 0 },
    // Cart items array with product reference and quantity
    cart: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 },
      name: { type: String, default: "" },
      image: { type: String, default: "" }
    }],
    // Enterprise: Password reset tokens
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    // Enterprise: Account verification token
    verificationToken: { type: String, select: false }
  },
  { timestamps: true }
);

// Index for performance
userSchema.index({ isActive: 1 });

// Hash password before save if changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12); // Increased rounds for security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare plain password with hashed
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Check if user has specific permission
userSchema.methods.hasPermission = function (permission) {
  // Get role hierarchy level (higher = more permissions)
  const roleLevel = {
    [ROLES.OWNER]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.STAFF]: 2,
    [ROLES.CUSTOMER]: 1
  };
  
  // Owner has all permissions
  if (this.role === ROLES.OWNER) return true;
  
  // Check role-based permissions
  const rolePerms = ROLE_PERMISSIONS[this.role] || [];
  if (rolePerms.includes(permission)) return true;
  
  // Check custom permissions
  if (this.customPermissions && this.customPermissions.includes(permission)) return true;
  
  return false;
};

// Check if user can manage another user (based on role hierarchy)
userSchema.methods.canManageUser = function (targetUser) {
  const roleLevel = {
    [ROLES.OWNER]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.STAFF]: 2,
    [ROLES.CUSTOMER]: 1
  };
  
  // Owner can manage everyone
  if (this.role === ROLES.OWNER) return true;
  
  // Admins can manage everyone below them
  if (this.role === ROLES.ADMIN && targetUser.role !== ROLES.OWNER) return true;
  
  // Managers can manage staff and below
  if (this.role === ROLES.MANAGER && 
      [ROLES.STAFF, ROLES.CUSTOMER].includes(targetUser.role)) return true;
  
  return false;
};

// Get all permissions for user
userSchema.methods.getAllPermissions = function () {
  const basePerms = ROLE_PERMISSIONS[this.role] || [];
  const customPerms = this.customPermissions || [];
  return [...new Set([...basePerms, ...customPerms])];
};

// Static method to check role hierarchy
userSchema.statics.getRoleLevel = function (role) {
  const levels = {
    [ROLES.OWNER]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.STAFF]: 2,
    [ROLES.CUSTOMER]: 1
  };
  return levels[role] || 0;
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
module.exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
