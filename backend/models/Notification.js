const mongoose = require("mongoose");

// Notification types
const NOTIFICATION_TYPES = {
  ORDER: "order",
  PAYMENT: "payment",
  RETURN: "return",
  REFUND: "refund",
  SYSTEM: "system",
  DELIVERY: "delivery",
  PROMO: "promo"
};

// Notification priority
const NOTIFICATION_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent"
};

const notificationSchema = new mongoose.Schema({
  // User who receives the notification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    required: true,
    index: true
  },
  
  // Priority level
  priority: {
    type: String,
    enum: Object.values(NOTIFICATION_PRIORITY),
    default: NOTIFICATION_PRIORITY.NORMAL
  },
  
  // Title and message
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Related data (order ID, product ID, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Reference to related document
  reference: {
    model: { type: String }, // "Order", "Product", etc.
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  
  // Notification channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  
  // Email/SMS sent status
  sentStatus: {
    email: { sent: Boolean, sentAt: Date, error: String },
    sms: { sent: Boolean, sentAt: Date, error: String }
  },
  
  // Action URL (where clicking the notification should go)
  actionUrl: {
    type: String
  },
  
  // Icon for display
  icon: {
    type: String,
    default: "bell"
  },
  
  // Color theme for the notification
  color: {
    type: String,
    default: "blue" // blue, green, red, orange, purple
  },
  
  // Expiration (optional - auto-delete after certain time)
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create and send notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = await this.create(data);
  return notification;
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const { page = 1, limit = 20, type, unreadOnly } = options;
  
  const query = { user: userId };
  if (type) query.type = type;
  if (unreadOnly) query.isRead = false;
  
  const skip = (page - 1) * limit;
  
  const [notifications, total, unreadCount] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
    this.countDocuments({ user: userId, isRead: false })
  ]);
  
  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete old notifications
notificationSchema.statics.cleanupOld = async function(userId, daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    user: userId,
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Method to get plain object for socket emission
notificationSchema.methods.toSocketPayload = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    message: this.message,
    data: this.data,
    priority: this.priority,
    actionUrl: this.actionUrl,
    icon: this.icon,
    color: this.color,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("Notification", notificationSchema);

// Export constants
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
module.exports.NOTIFICATION_PRIORITY = NOTIFICATION_PRIORITY;

