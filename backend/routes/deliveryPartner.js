const express = require("express");
const mongoose = require("mongoose");
const { protect, adminAndAbove } = require("../middleware/authMiddleware");
const DeliveryPartner = require("../models/DeliveryPartner");
const Order = require("../models/Order");
const User = require("../models/User");
const { emitOrderStatusUpdate, emitDeliveryPartnerNotification } = require("../config/socket");

const router = express.Router();

// Apply admin middleware to all routes (except delivery partner self routes)
const requireAdminOrDeliveryPartner = (req, res, next) => {
  const allowedRoles = ['owner', 'admin', 'deliveryPartner'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied" 
    });
  }
  next();
};

// GET /api/delivery-partners - Get all delivery partners (admin)
router.get("/", protect, adminAndAbove, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isAvailable, 
      search,
      sort = "rating" 
    } = req.query;
    
    const query = {};
    
    // Filter by availability
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    let sortOption = { rating: -1, totalDeliveries: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'deliveries') sortOption = { totalDeliveries: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [partners, total] = await Promise.all([
      DeliveryPartner.find(query)
        .populate('user', 'name email phone')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      DeliveryPartner.countDocuments(query)
    ]);

    res.json({
      success: true,
      partners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Get delivery partners error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch delivery partners" });
  }
});

// GET /api/delivery-partners/available - Get available delivery partners
router.get("/available", protect, adminAndAbove, async (req, res) => {
  try {
    const { pincode, zone } = req.query;
    
    const partners = await DeliveryPartner.findAvailable(pincode, zone);

    res.json({
      success: true,
      partners
    });
  } catch (err) {
    console.error("Get available partners error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch available partners" });
  }
});

// GET /api/delivery-partners/me - Get current delivery partner profile
router.get("/me", protect, async (req, res) => {
  try {
    if (req.user.role !== 'deliveryPartner') {
      return res.status(403).json({ 
        success: false, 
        message: "Not a delivery partner" 
      });
    }

    let partner = await DeliveryPartner.findOne({ user: req.user.id })
      .populate('user', 'name email phone');
    
    if (!partner) {
      return res.status(404).json({ 
        success: false, 
        message: "Delivery partner profile not found" 
      });
    }

    res.json({
      success: true,
      partner
    });
  } catch (err) {
    console.error("Get my profile error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
});

// GET /api/delivery-partners/:id - Get single delivery partner
router.get("/:id", protect, adminAndAbove, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id)
      .populate('user', 'name email phone');
    
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    res.json({
      success: true,
      partner
    });
  } catch (err) {
    console.error("Get delivery partner error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch delivery partner" });
  }
});

// POST /api/delivery-partners - Create delivery partner (admin)
router.post("/", protect, adminAndAbove, async (req, res) => {
  try {
    const { userId, name, phone, email, vehicleType, vehicleNumber, zones, workingHours } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if already a delivery partner
    const existingPartner = await DeliveryPartner.findOne({ user: userId });
    if (existingPartner) {
      return res.status(400).json({ success: false, message: "User is already a delivery partner" });
    }

    // Update user role
    user.role = 'deliveryPartner';
    await user.save();

    // Create delivery partner profile
    const partner = await DeliveryPartner.create({
      user: userId,
      name: name || user.name,
      phone,
      email: email || user.email,
      vehicleType,
      vehicleNumber,
      zones: zones || [],
      workingHours
    });

    res.status(201).json({
      success: true,
      partner,
      message: "Delivery partner created successfully"
    });
  } catch (err) {
    console.error("Create delivery partner error:", err);
    res.status(500).json({ success: false, message: "Failed to create delivery partner" });
  }
});

// PUT /api/delivery-partners/:id - Update delivery partner
router.put("/:id", protect, adminAndAbove, async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      email, 
      vehicleType, 
      vehicleNumber, 
      zones, 
      workingHours,
      isActive,
      notes 
    } = req.body;

    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    // Update fields
    if (name) partner.name = name;
    if (phone) partner.phone = phone;
    if (email) partner.email = email;
    if (vehicleType) partner.vehicleType = vehicleType;
    if (vehicleNumber) partner.vehicleNumber = vehicleNumber;
    if (zones) partner.zones = zones;
    if (workingHours) partner.workingHours = workingHours;
    if (isActive !== undefined) partner.isActive = isActive;
    if (notes) partner.notes = notes;

    await partner.save();

    res.json({
      success: true,
      partner,
      message: "Delivery partner updated successfully"
    });
  } catch (err) {
    console.error("Update delivery partner error:", err);
    res.status(500).json({ success: false, message: "Failed to update delivery partner" });
  }
});

// PUT /api/delivery-partners/:id/availability - Toggle availability
router.put("/:id/availability", protect, async (req, res) => {
  try {
    // Only the partner themselves or admin can toggle
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    // Check permission
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      if (partner.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    partner.isAvailable = !partner.isAvailable;
    await partner.save();

    res.json({
      success: true,
      partner,
      message: partner.isAvailable ? "You are now available for deliveries" : "You are now unavailable"
    });
  } catch (err) {
    console.error("Toggle availability error:", err);
    res.status(500).json({ success: false, message: "Failed to update availability" });
  }
});

// PUT /api/delivery-partners/:id/assign-order - Assign order to delivery partner
router.put("/:id/assign-order", protect, adminAndAbove, async (req, res) => {
  try {
    const { orderId } = req.body;

    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    if (!partner.isAvailable) {
      return res.status(400).json({ success: false, message: "Partner is not available" });
    }

    // Find and update the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if order is in correct status for assignment
    if (!['packed', 'shipped'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Order must be packed or shipped before assignment" 
      });
    }

    // Assign partner to order
    order.deliveryPartner = partner._id;
    
    // Add timeline entry
    order.orderTimeline.push({
      status: order.status,
      statusLabel: `Assigned to delivery partner: ${partner.name}`,
      timestamp: new Date(),
      updatedBy: req.user.id,
      updatedByName: req.user.name || 'Admin',
      updatedByRole: req.user.role,
      notes: `Assigned to ${partner.name} (${partner.phone})`
    });
    
    await order.save();

    // Assign order to partner
    await partner.assignOrder(orderId);

    // Emit socket event
    emitOrderStatusUpdate(order.user.toString(), {
      orderId: order._id,
      status: order.status,
      deliveryPartner: {
        id: partner._id,
        name: partner.name,
        phone: partner.phone
      },
      message: `Your order has been assigned to ${partner.name} for delivery`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      order,
      partner,
      message: `Order assigned to ${partner.name}`
    });
  } catch (err) {
    console.error("Assign order error:", err);
    res.status(500).json({ success: false, message: "Failed to assign order" });
  }
});

// GET /api/delivery-partners/:id/orders - Get assigned orders for delivery partner
router.get("/:id/orders", protect, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Verify permission
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    // Only partner themselves or admin can view
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      if (partner.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    const query = { deliveryPartner: partner._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (err) {
    console.error("Get partner orders error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// PUT /api/delivery-partners/orders/:orderId/status - Update delivery status
router.put("/orders/:orderId/status", protect, async (req, res) => {
  try {
    const { status, notes } = req.body;

    // Find the order
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Find delivery partner
    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) {
      return res.status(403).json({ success: false, message: "Not a delivery partner" });
    }

    // Verify this order is assigned to this partner
    if (order.deliveryPartner?.toString() !== partner._id.toString()) {
      return res.status(403).json({ success: false, message: "Order not assigned to you" });
    }

    // Validate status transition
    const validDeliveryStatuses = ['shipped', 'out_for_delivery', 'delivered'];
    if (!validDeliveryStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Use: shipped, out_for_delivery, delivered" 
      });
    }

    // Check current status
    const currentStatus = order.status;
    const allowedTransitions = {
      'packed': ['shipped'],
      'shipped': ['out_for_delivery'],
      'out_for_delivery': ['delivered']
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change from ${currentStatus} to ${status}` 
      });
    }

    // Update order
    order.status = status;
    order.orderStatus = status;
    
    // Update delivery stages
    order.updateDeliveryStage(status);
    
    // Add timeline entry
    order.addTimelineEntry(
      status, 
      req.user.id, 
      partner.name, 
      'deliveryPartner',
      notes || `Status updated to ${status}`
    );

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      
      // Complete delivery for partner
      await partner.completeDelivery(order._id);
    }

    await order.save();

    // Emit socket event to customer
    emitOrderStatusUpdate(order.user.toString(), {
      orderId: order._id,
      orderIdDisplay: order.orderId,
      status: order.status,
      statusLabel: getStatusLabel(status),
      deliveryStages: order.deliveryStages,
      timeline: order.orderTimeline.slice(-1)[0],
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      order,
      message: ` ${status}`
    });
  } catch (err) {
    console.error("Order status updated toUpdate delivery status error:", err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

// DELETE /api/delivery-partners/:id - Delete delivery partner
router.delete("/:id", protect, async (req, res) => {
  try {
    // Only owner can delete
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: "Only owner can delete delivery partners" });
    }

    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found" });
    }

    // Check for active orders
    if (partner.assignedOrders && partner.assignedOrders.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete partner with active orders" 
      });
    }

    // Update user role back to customer
    await User.findByIdAndUpdate(partner.user, { role: 'customer' });

    // Delete partner
    await DeliveryPartner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Delivery partner deleted successfully"
    });
  } catch (err) {
    console.error("Delete delivery partner error:", err);
    res.status(500).json({ success: false, message: "Failed to delete delivery partner" });
  }
});

// Helper function to get status label
function getStatusLabel(status) {
  const labels = {
    'pending': 'Order Placed',
    'confirmed': 'Order Confirmed',
    'processing': 'Processing',
    'packed': 'Packed',
    'shipped': 'Shipped',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'returned': 'Returned',
    'refunded': 'Refunded'
  };
  return labels[status] || status;
}

module.exports = router;

