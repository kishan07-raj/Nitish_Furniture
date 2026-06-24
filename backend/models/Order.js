// backend/models/Order.js
const mongoose = require("mongoose");

// ============================================
// ORDER STATUS CONFIGURATION
// ============================================
const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  PACKED: "packed",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
  REFUNDED: "refunded"
};

// Status progression - defines valid next steps
const STATUS_PROGRESSION = {
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PROCESSING]: [ORDER_STATUSES.PACKED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PACKED]: [ORDER_STATUSES.SHIPPED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.OUT_FOR_DELIVERY],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.RETURNED]: [ORDER_STATUSES.REFUNDED],
  [ORDER_STATUSES.REFUNDED]: []
};

// Order item sub-schema
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedWood: { type: String },
    selectedSize: { type: String },
    selectedFinish: { type: String },
    pricePerUnit: { type: Number, required: true },
    image: { type: String, default: "" }
  },
  { _id: false }
);

// ============================================
// ORDER TIMELINE SUB-SCHEMA
// ============================================
const orderTimelineSchema = new mongoose.Schema({
  status: { 
    type: String, 
    required: true,
    enum: Object.values(ORDER_STATUSES)
  },
  statusLabel: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  updatedByName: { type: String },
  updatedByRole: { type: String },
  notes: { type: String },
  isSystemUpdate: { type: Boolean, default: false }
}, { _id: true });

// Delivery stages sub-schema
const deliveryStagesSchema = new mongoose.Schema({
  confirmed: { type: Date },
  processing: { type: Date },
  packed: { type: Date },
  shipped: { type: Date },
  outForDelivery: { type: Date },
  delivered: { type: Date }
}, { _id: false });

// Virtual for calculating item subtotal
orderItemSchema.set('toJSON', { virtuals: true });
orderItemSchema.set('toObject', { virtuals: true });
orderItemSchema.virtual('itemSubtotal').get(function() {
  return (this.pricePerUnit || 0) * (this.quantity || 0);
});

const orderSchema = new mongoose.Schema(
  {
    // Enterprise: Unique order ID (ORD-2026-XXXXX format)
    orderId: { type: String, unique: true, sparse: true },
    orderSessionId: { type: String }, // Prevent duplicate orders on refresh
    
    // Enterprise: User reference with index for fast queries
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    
    // Enterprise: Order items with subtotal
    items: { type: [orderItemSchema], required: true, validate: {
      validator: function(v) { return v && v.length > 0; },
      message: "Order must have at least one item"
    }},
    
    // Enterprise: Price breakdown fields
    itemsTotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 }, // Enterprise: Discount field
    tax: { type: Number, default: 0 }, // Enterprise: Tax field
    shippingFee: { type: Number, default: 0 }, // Enterprise: Shipping fee field
    shippingCharge: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    
    // Enterprise: Enhanced status with more states
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
      index: true
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING
    },
    
    // ============================================
    // ENTERPRISE: ORDER TIMELINE
    // ============================================
    orderTimeline: {
      type: [orderTimelineSchema],
      default: [] // Will be populated when order is created
    },
    
    // ============================================
    // ENTERPRISE: DELIVERY STAGES
    // ============================================
    deliveryStages: {
      type: deliveryStagesSchema,
      default: {}
    },
    
    // Enterprise: Shipping address with landmark
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      landmark: { type: String }, // Enterprise: Landmark field
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
      addressType: { type: String, default: "Home" } // Enterprise: Address type
    },
    
    // Enterprise: Enhanced payment
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "CARD", "UPI", "WALLET"],
      default: "COD"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending"
    },
    paymentProvider: { type: String, default: "razorpay" },
    paymentId: { type: String }, // Enterprise: Payment gateway transaction ID
    
    // Enterprise: Delivery tracking
    estimatedDelivery: { type: Date },
    expectedDeliveryDate: { type: Date }, // Enterprise: Expected delivery date
    deliveredAt: { type: Date },
    trackingId: { type: String }, // Enterprise: Renamed from trackingNumber
    trackingNumber: { type: String }, // Legacy support
    deliveryPartner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "DeliveryPartner" 
    }, // Enterprise: Delivery partner reference
    
    // Enterprise: Refund handling
    isRefunded: { type: Boolean, default: false },
    refundedAt: { type: Date },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String },
    refundApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    refundRequestAt: { type: Date }, // Enterprise: When refund was requested
    refundStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "refunded"],
      default: "none"
    },
    
    // Enterprise: Order notes
    notes: { type: String },
    customerNotes: { type: String }, // Enterprise: Customer notes
    
    // Enterprise: Cancellation with full tracking
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Enterprise: Return handling
    isReturned: { type: Boolean, default: false },
    returnedAt: { type: Date },
    returnReason: { type: String },
    returnApprovedAt: { type: Date },
    returnRejectedAt: { type: Date },
    returnStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "completed"],
      default: "none"
    },
    returnApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Enterprise: isPaid convenience field
    isPaid: { type: Boolean, default: false },
    
    // Enterprise: Order source tracking
    source: { type: String, default: "web" }, // web, mobile, admin
    couponCode: { type: String }, // Enterprise: Coupon code used
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Enterprise: Referral tracking
  },
  { timestamps: true }
);

// ============================================
// Enterprise: Virtual for calculating totals
// ============================================
orderSchema.virtual('subtotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((sum, item) => {
    return sum + ((item.pricePerUnit || 0) * (item.quantity || 0));
  }, 0);
});

// Set virtuals in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// ============================================
// Enterprise: Pre-save middleware to auto-calculate
// ============================================
orderSchema.pre('save', function(next) {
  // Auto-calculate subtotals for each item
  if (this.items && this.items.length > 0) {
    this.items = this.items.map(item => ({
      ...item.toObject(),
      subtotal: (item.pricePerUnit || 0) * (item.quantity || 0)
    }));
    
    // Recalculate itemsTotal
    this.itemsTotal = this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    // Calculate grandTotal
    this.grandTotal = this.itemsTotal + (this.tax || 0) + (this.shippingFee || 0) + (this.shippingCharge || 0) - (this.discount || 0);
  }
  
  // Set isPaid based on paymentStatus
  this.isPaid = this.paymentStatus === 'paid';
  
  next();
});

// ============================================
// Enterprise: Indexes for performance
// ============================================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderSessionId: 1 });
orderSchema.index({ 'shippingAddress.pincode': 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderId: 1 });

// ============================================
// Enterprise: Static methods
// ============================================

// Get orders by user with pagination
orderSchema.statics.getUserOrders = async function(userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const query = { user: userId };
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  const [orders, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone'),
    this.countDocuments(query)
  ]);
  
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get order statistics
orderSchema.statics.getOrderStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$grandTotal" },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$isCancelled", true] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || { totalOrders: 0, totalSpent: 0, cancelledOrders: 0, deliveredOrders: 0 };
};

module.exports = mongoose.model("Order", orderSchema);

// ============================================
// ENTERPRISE: WORKFLOW VALIDATION METHODS
// ============================================

// Status labels for display
const STATUS_LABELS = {
  pending: "Order Placed",
  confirmed: "Order Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded"
};

// Validate if status transition is allowed
orderSchema.statics.isValidStatusTransition = function(currentStatus, newStatus) {
  const allowedTransitions = STATUS_PROGRESSION[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

// Get allowed next statuses
orderSchema.statics.getAllowedNextStatuses = function(currentStatus) {
  return STATUS_PROGRESSION[currentStatus] || [];
};

// Add timeline entry
orderSchema.methods.addTimelineEntry = function(status, userId, userName, userRole, notes = '') {
  const entry = {
    status,
    statusLabel: STATUS_LABELS[status] || status,
    timestamp: new Date(),
    updatedBy: userId,
    updatedByName: userName,
    updatedByRole: userRole,
    notes,
    isSystemUpdate: !userId
  };
  
  this.orderTimeline.push(entry);
  return entry;
};

// Update delivery stages
orderSchema.methods.updateDeliveryStage = function(status) {
  const stageMap = {
    'confirmed': 'confirmed',
    'processing': 'processing',
    'packed': 'packed',
    'shipped': 'shipped',
    'out_for_delivery': 'outForDelivery',
    'delivered': 'delivered'
  };
  
  const stage = stageMap[status];
  if (stage) {
    this.deliveryStages[stage] = new Date();
  }
  return this.deliveryStages;
};

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  return !nonCancellableStatuses.includes(this.status);
};

// Check if order can be edited
orderSchema.methods.canBeEdited = function() {
  const nonEditableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  return !nonEditableStatuses.includes(this.status);
};

// Check if order can have return requested
orderSchema.methods.canRequestReturn = function() {
  if (this.status !== 'delivered') return false;
  if (this.isReturned || this.returnStatus === 'requested') return false;
  
  // Check 7-day return window
  if (this.deliveredAt) {
    const returnWindow = 7 * 24 * 60 * 60 * 1000;
    const daysSinceDelivery = Date.now() - new Date(this.deliveredAt).getTime();
    if (daysSinceDelivery > returnWindow) return false;
  }
  
  return true;
};

// Export constants
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.STATUS_PROGRESSION = STATUS_PROGRESSION;
module.exports.STATUS_LABELS = STATUS_LABELS;
