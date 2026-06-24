const express = require("express");
const mongoose = require("mongoose");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const User = require("../models/User");

const router = express.Router();

// GET /api/admin/orders - Get all orders with pagination and filters
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search, sort = "newest" } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "price-high") sortOption = { grandTotal: -1 };
    if (sort === "price-low") sortOption = { grandTotal: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email phone")
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Admin orders list error:", err);
    res.status(500).json({ success: false, message: "Could not fetch orders" });
  }
});

// GET /api/admin/orders/analytics - Get order analytics
router.get("/analytics", protect, adminOnly, async (req, res) => {
  try {
    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    // Aggregate analytics
    const [
      todayOrders,
      weekOrders,
      monthOrders,
      totalRevenue,
      statusCounts,
      paymentStatusCounts,
      revenueByDay,
      topProducts
    ] = await Promise.all([
      // Today's orders
      Order.find({
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }).sort({ createdAt: -1 }),
      
      // This week's orders
      Order.find({
        createdAt: { $gte: weekStart }
      }),
      
      // This month's orders
      Order.find({
        createdAt: { $gte: monthStart }
      }),
      
      // Total revenue (paid orders only)
      Order.aggregate([
        { $match: { paymentStatus: "paid", isCancelled: false } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } }
      ]),
      
      // Orders by status
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      // Orders by payment status
      Order.aggregate([
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
      ]),
      
      // Revenue by day (last 7 days)
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: weekStart },
            paymentStatus: "paid",
            isCancelled: false 
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$grandTotal" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top selling products
      Order.aggregate([
        { $match: { isCancelled: false } },
        { $unwind: "$items" },
        { $group: { 
          _id: "$items.name", 
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.pricePerUnit", "$items.quantity"] } }
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Calculate revenue
    const totalRevenueAmount = totalRevenue[0]?.total || 0;
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // Format status counts
    const statusBreakdown = {};
    statusCounts.forEach(s => { statusBreakdown[s._id] = s.count; });
    
    const paymentBreakdown = {};
    paymentStatusCounts.forEach(p => { paymentBreakdown[p._id] = p.count; });

    res.json({
      success: true,
      analytics: {
        overview: {
          todayOrders: todayOrders.length,
          todayRevenue,
          weekOrders: weekOrders.length,
          weekRevenue,
          monthOrders: monthOrders.length,
          monthRevenue,
          totalRevenue: totalRevenueAmount,
          totalOrders: totalRevenue.length > 0 ? statusCounts.reduce((a, b) => a + b.count, 0) : 0
        },
        statusBreakdown,
        paymentBreakdown,
        revenueByDay,
        topProducts
      }
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    res.status(500).json({ success: false, message: "Could not fetch analytics" });
  }
});

// GET /api/admin/orders/:id - Get single order detail
router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Admin order detail error:", err);
    res.status(500).json({ success: false, message: "Could not fetch order" });
  }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus, trackingId, notes, cancellationReason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Store old status for timeline
    const oldStatus = order.status;
    
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded", "partially_refunded"];

    if (status && validStatuses.includes(status)) {
      // Validate status transition if model method exists
      if (Order.isValidStatusTransition && !Order.isValidStatusTransition(oldStatus, status)) {
        console.warn(`Invalid status transition from ${oldStatus} to ${status}`);
        // Allow for now but log warning
      }
      
      order.status = status;
      
      if (status === "confirmed") {
        order.orderStatus = "confirmed";
        order.updateDeliveryStage("confirmed");
      }
      else if (status === "processing") {
        order.orderStatus = "processing";
        order.updateDeliveryStage("processing");
      }
      else if (status === "shipped") {
        order.orderStatus = "shipped";
        order.trackingId = trackingId || order.trackingId || `NFH${Date.now().toString(36).toUpperCase()}`;
        order.trackingNumber = order.trackingId;
        order.updateDeliveryStage("shipped");
      }
      else if (status === "delivered") {
        order.orderStatus = "delivered";
        order.deliveredAt = new Date();
        order.updateDeliveryStage("delivered");
      }
      else if (status === "cancelled") {
        order.orderStatus = "cancelled";
        order.isCancelled = true;
        order.cancelledAt = new Date();
        order.cancellationReason = cancellationReason || "Cancelled by admin";
        order.cancelledBy = req.user.id;
      }
      else if (status === "returned") {
        order.orderStatus = "returned";
        order.isReturned = true;
        order.returnedAt = new Date();
      }
      else {
        order.orderStatus = status;
      }

      // Add timeline entry for status change
      const statusLabels = {
        pending: "Order Placed",
        confirmed: "Order Confirmed",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
        returned: "Returned"
      };
      
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: status,
        statusLabel: statusLabels[status] || status,
        timestamp: new Date(),
        updatedBy: req.user.id,
        updatedByName: req.user.name || "Admin",
        updatedByRole: req.user.role,
        notes: notes || `Status changed from ${oldStatus} to ${status}`,
        isSystemUpdate: false
      });
    }

    if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
      const oldPaymentStatus = order.paymentStatus;
      order.paymentStatus = paymentStatus;
      
      // Add timeline entry for payment status change
      if (oldPaymentStatus !== paymentStatus) {
        order.orderTimeline = order.orderTimeline || [];
        order.orderTimeline.push({
          status: order.status,
          statusLabel: `Payment: ${paymentStatus}`,
          timestamp: new Date(),
          updatedBy: req.user.id,
          updatedByName: req.user.name || "Admin",
          updatedByRole: req.user.role,
          notes: `Payment status changed from ${oldPaymentStatus} to ${paymentStatus}`,
          isSystemUpdate: false
        });
      }
    }

    if (notes) order.notes = notes;
    if (trackingId) {
      order.trackingId = trackingId;
      order.trackingNumber = trackingId;
    }

    await order.save();

    const updated = await Order.findById(order._id)
      .populate("user", "name email phone");

    // Emit socket event for real-time update
    try {
      const { emitOrderStatusUpdate } = require("../config/socket");
      emitOrderStatusUpdate(order.user.toString(), {
        orderId: order._id,
        status: order.status,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        trackingId: order.trackingId,
        timestamp: new Date().toISOString()
      });
    } catch (socketErr) {
      console.warn("Socket emit failed:", socketErr.message);
    }

    res.json({ success: true, order: updated, message: "Order status updated" });
  } catch (err) {
    console.error("Admin update order status error:", err);
    res.status(500).json({ success: false, message: "Could not update order" });
  }
});

// PUT /api/admin/orders/:id - Update entire order
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("user", "name email");
    
    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.json({ success: true, order: updated, message: "Order updated successfully" });
  } catch (err) {
    console.error("Admin update order error:", err);
    res.status(500).json({ success: false, message: "Could not update order" });
  }
});

// DELETE /api/admin/orders/:id - Delete order (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow deletion of cancelled orders
    if (!order.isCancelled) {
      return res.status(400).json({ 
        success: false, 
        message: "Only cancelled orders can be deleted" 
      });
    }

    await Order.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("Admin delete order error:", err);
    res.status(500).json({ success: false, message: "Could not delete order" });
  }
});

// POST /api/admin/orders/bulk-update - Bulk update orders
router.post("/bulk-update", protect, adminOnly, async (req, res) => {
  try {
    const { orderIds, status, paymentStatus } = req.body;

    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ 
        success: false, 
        message: "Order IDs array is required" 
      });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      updateFields
    );

    res.json({ 
      success: true, 
      message: `${result.modifiedCount} orders updated`,
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("Admin bulk update error:", err);
    res.status(500).json({ success: false, message: "Could not bulk update orders" });
  }
});

module.exports = router;

