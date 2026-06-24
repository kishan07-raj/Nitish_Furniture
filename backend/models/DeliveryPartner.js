const mongoose = require("mongoose");

// Delivery partner schema
const deliveryPartnerSchema = new mongoose.Schema({
  // Link to User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  
  // Personal information
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Vehicle information
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'car', 'van', 'truck', 'other'],
    default: 'bike'
  },
  vehicleNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // Work status
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Location tracking
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    lastUpdated: { type: Date }
  },
  serviceArea: {
    type: String,
    default: "all" // Can be specific cities or "all"
  },
  zones: [{
    type: String
  }],
  
  // Performance metrics
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  successfulDeliveries: {
    type: Number,
    default: 0
  },
  cancelledDeliveries: {
    type: Number,
    default: 0
  },
  
  // Assigned orders (for quick reference)
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],
  
  // Earnings
  totalEarnings: {
    type: Number,
    default: 0
  },
  pendingPayout: {
    type: Number,
    default: 0
  },
  
  // Verification documents (store URLs)
  documents: {
    drivingLicense: { type: String },
    aadharCard: { type: String },
    vehicleInsurance: { type: String }
  },
  
  // Admin notes
  notes: {
    type: String
  },
  
  // Shift timing
  workingHours: {
    start: { type: String }, // "09:00"
    end: { type: String }    // "18:00"
  },
  
  // Last activity
  lastActiveAt: {
    type: Date
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }
}, {
  timestamps: true
});

// Indexes for performance
deliveryPartnerSchema.index({ isAvailable: 1 });
deliveryPartnerSchema.index({ serviceArea: 1 });
deliveryPartnerSchema.index({ rating: -1 });

// Virtual for delivery success rate
deliveryPartnerSchema.virtual('successRate').get(function() {
  if (this.totalDeliveries === 0) return 100;
  return Math.round((this.successfulDeliveries / this.totalDeliveries) * 100);
});

// Set virtuals in JSON
deliveryPartnerSchema.set('toJSON', { virtuals: true });
deliveryPartnerSchema.set('toObject', { virtuals: true });

// Static method to find available partners
deliveryPartnerSchema.statics.findAvailable = function(pincode, zone) {
  return this.find({
    isAvailable: true,
    isActive: true,
    $or: [
      { serviceArea: 'all' },
      { serviceArea: pincode },
      { zones: zone }
    ]
  }).sort({ rating: -1, totalDeliveries: -1 });
};

// Static method to get partners by area
deliveryPartnerSchema.statics.findByArea = function(area) {
  return this.find({
    isActive: true,
    $or: [
      { serviceArea: 'all' },
      { serviceArea: { $regex: area, $options: 'i' } },
      { zones: { $regex: area, $options: 'i' } }
    ]
  });
};

// Method to assign order
deliveryPartnerSchema.methods.assignOrder = async function(orderId) {
  if (!this.isAvailable) {
    throw new Error("Partner is not available");
  }
  
  this.assignedOrders.push(orderId);
  this.currentOrderId = orderId;
  this.isAvailable = false;
  
  await this.save();
  return this;
};

// Method to complete delivery
deliveryPartnerSchema.methods.completeDelivery = async function(orderId) {
  const orderIndex = this.assignedOrders.indexOf(orderId);
  if (orderIndex > -1) {
    this.assignedOrders.splice(orderIndex, 1);
  }
  
  this.successfulDeliveries += 1;
  this.totalDeliveries += 1;
  this.currentOrderId = null;
  this.isAvailable = true;
  this.lastActiveAt = new Date();
  
  await this.save();
  return this;
};

// Method to cancel delivery
deliveryPartnerSchema.methods.cancelDelivery = async function(orderId) {
  const orderIndex = this.assignedOrders.indexOf(orderId);
  if (orderIndex > -1) {
    this.assignedOrders.splice(orderIndex, 1);
  }
  
  this.cancelledDeliveries += 1;
  this.totalDeliveries += 1;
  this.currentOrderId = null;
  this.isAvailable = true;
  
  await this.save();
  return this;
};

// Method to update location
deliveryPartnerSchema.methods.updateLocation = async function(lat, lng) {
  this.currentLocation = {
    lat,
    lng,
    lastUpdated: new Date()
  };
  this.lastActiveAt = new Date();
  
  await this.save();
  return this;
};

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);

