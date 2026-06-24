// backend/models/AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      "user_login", "user_logout", "user_register",
      "user_create", "user_update", "user_delete", "user_role_change", "user_block", "user_unblock",
      // Product actions
      "product_create", "product_update", "product_delete", "product_bulk_upload",
      // Order actions
      "order_create", "order_update", "order_status_change", "order_cancel", "order_refund",
      // Settings actions
      "settings_update", "settings_create",
      // System actions
      "backup_create", "backup_restore", "api_key_create", "api_key_delete"
    ]
  },
  resource: {
    type: String,
    enum: ["user", "product", "order", "settings", "backup", "api_key", "dashboard", "cms"]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    sparse: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success"
  },
  errorMessage: {
    type: String
  }
}, { timestamps: true });

// Indexes for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ createdAt: -1 });

// Static method to log an action
auditLogSchema.statics.log = async function(data) {
  try {
    const log = await this.create(data);
    return log;
  } catch (err) {
    console.error("Audit log error:", err);
    // Don't throw - audit logging should not break main flow
  }
};

// Static method to get recent logs
auditLogSchema.statics.getRecentLogs = async function(limit = 50, options = {}) {
  const query = {};
  
  if (options.user) query.user = options.user;
  if (options.action) query.action = options.action;
  if (options.resource) query.resource = options.resource;
  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = options.startDate;
    if (options.endDate) query.createdAt.$lte = options.endDate;
  }
  
  return this.find(query)
    .populate("user", "name email role")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
