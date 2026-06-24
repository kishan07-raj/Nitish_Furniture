// backend/routes/owner.js
const express = require("express");
const mongoose = require("mongoose");
const { protect, ownerOnly } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// Apply ownerOnly middleware to all routes
router.use(protect, ownerOnly);

// GET /api/owner/users - Get all users with filters and pagination
router.get("/users", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search, 
      isBlocked,
      sort = "newest" 
    } = req.query;
    
    const query = {};
    
    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Filter by blocked status
    if (isBlocked !== undefined && isBlocked !== 'all') {
      query.isBlocked = isBlocked === 'true';
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'name_asc') sortOption = { name: 1 };
    if (sort === 'name_desc') sortOption = { name: -1 };
    if (sort === 'blocked') sortOption = { blockedAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Owner users list error:", err);
    res.status(500).json({ success: false, message: "Could not fetch users" });
  }
});

// GET /api/owner/users/:id - Get single user with full details
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user statistics
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$grandTotal" },
          cancelledOrders: { $sum: { $cond: ["$isCancelled", 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      user,
      stats: orderStats[0] || { totalOrders: 0, totalSpent: 0, cancelledOrders: 0 }
    });
  } catch (err) {
    console.error("Owner user detail error:", err);
    res.status(500).json({ success: false, message: "Could not fetch user" });
  }
});

// PUT /api/owner/users/:id/block - Block user with reason
router.put("/users/:id/block", async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent blocking owner
    if (user.role === 'owner') {
      return res.status(403).json({ success: false, message: "Cannot block the owner" });
    }

    // Prevent self-blocking
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot block yourself" });
    }

    // Check if already blocked
    if (user.isBlocked) {
      return res.status(400).json({ success: false, message: "User is already blocked" });
    }

    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockReason = reason || "Blocked by administrator";
    await user.save();

    // Log the action
    await AuditLog.log({
      user: req.user.id,
      action: "user_block",
      resource: "user",
      resourceId: user._id,
      details: { reason: user.blockReason },
      status: "success"
    });

    res.json({
      success: true,
      message: "User blocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt,
        blockReason: user.blockReason
      }
    });
  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ success: false, message: "Could not block user" });
  }
});

// PUT /api/owner/users/:id/unblock - Unblock user
router.put("/users/:id/unblock", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if not blocked
    if (!user.isBlocked) {
      return res.status(400).json({ success: false, message: "User is not blocked" });
    }

    user.isBlocked = false;
    user.blockedAt = undefined;
    user.blockReason = undefined;
    await user.save();

    // Log the action
    await AuditLog.log({
      user: req.user.id,
      action: "user_unblock",
      resource: "user",
      resourceId: user._id,
      details: { previousBlockReason: user.blockReason },
      status: "success"
    });

    res.json({
      success: true,
      message: "User unblocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (err) {
    console.error("Unblock user error:", err);
    res.status(500).json({ success: false, message: "Could not unblock user" });
  }
});

// PUT /api/owner/users/:id/promote - Promote user to admin
router.put("/users/:id/promote", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent modifying owner
    if (user.role === 'owner') {
      return res.status(403).json({ success: false, message: "Cannot modify owner role" });
    }

    // Check if already admin
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: "User is already an admin" });
    }

    const previousRole = user.role;
    user.role = 'admin';
    await user.save();

    // Log the action
    await AuditLog.log({
      user: req.user.id,
      action: "user_promote",
      resource: "user",
      resourceId: user._id,
      details: { previousRole, newRole: 'admin' },
      status: "success"
    });

    res.json({
      success: true,
      message: "User promoted to admin successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Promote user error:", err);
    res.status(500).json({ success: false, message: "Could not promote user" });
  }
});

// PUT /api/owner/users/:id/demote - Demote admin to user
router.put("/users/:id/demote", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent modifying owner
    if (user.role === 'owner') {
      return res.status(403).json({ success: false, message: "Cannot modify owner role" });
    }

    // Check if not admin
    if (user.role !== 'admin') {
      return res.status(400).json({ success: false, message: "User is not an admin" });
    }

    const previousRole = user.role;
    user.role = 'customer';
    await user.save();

    // Log the action
    await AuditLog.log({
      user: req.user.id,
      action: "user_demote",
      resource: "user",
      resourceId: user._id,
      details: { previousRole, newRole: 'customer' },
      status: "success"
    });

    res.json({
      success: true,
      message: "Admin demoted to user successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Demote user error:", err);
    res.status(500).json({ success: false, message: "Could not demote user" });
  }
});

// DELETE /api/owner/users/:id - Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent deleting owner
    if (user.role === 'owner') {
      return res.status(403).json({ success: false, message: "Cannot delete owner" });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete yourself" });
    }

    // Store user info for audit
    const userInfo = {
      name: user.name,
      email: user.email,
      role: user.role
    };

    await User.findByIdAndDelete(userId);

    // Log the action
    await AuditLog.log({
      user: req.user.id,
      action: "user_delete",
      resource: "user",
      resourceId: userId,
      details: { deletedUser: userInfo },
      status: "success"
    });

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Could not delete user" });
  }
});

// GET /api/owner/analytics - Get full analytics
router.get("/analytics", async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch(period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get various statistics
    const [
      totalRevenue,
      totalOrders,
      cancelledOrders,
      pendingOrders,
      deliveredOrders,
      totalUsers,
      blockedUsers,
      activeUsers,
      recentOrders,
      topProducts,
      monthlySales
    ] = await Promise.all([
      // Total revenue
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } }
      ]),
      // Total orders
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      // Cancelled orders
      Order.countDocuments({ isCancelled: true, createdAt: { $gte: startDate } }),
      // Pending orders
      Order.countDocuments({ status: 'pending', createdAt: { $gte: startDate } }),
      // Delivered orders
      Order.countDocuments({ status: 'delivered', createdAt: { $gte: startDate } }),
      // Total users
      User.countDocuments({}),
      // Blocked users
      User.countDocuments({ isBlocked: true }),
      // Active users (logged in last 30 days)
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      // Recent orders
      Order.find({ createdAt: { $gte: startDate } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email'),
      // Top selling products
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.name", totalSold: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.pricePerUnit", "$items.quantity"] } } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]),
      // Monthly sales for chart
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            revenue: { $sum: "$grandTotal" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate orders today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

    // Calculate revenue today
    const revenueToday = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);

    res.json({
      success: true,
      analytics: {
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: revenueToday[0]?.total || 0,
          period
        },
        orders: {
          total: totalOrders,
          today: ordersToday,
          cancelled: cancelledOrders,
          pending: pendingOrders,
          delivered: deliveredOrders
        },
        users: {
          total: totalUsers,
          blocked: blockedUsers,
          active: activeUsers
        },
        topProducts: topProducts.map(p => ({
          name: p._id,
          sold: p.totalSold,
          revenue: p.revenue
        })),
        monthlySales: monthlySales.map(m => ({
          month: m._id,
          revenue: m.revenue,
          orders: m.orders
        }))
      }
    });
  } catch (err) {
    console.error("Owner analytics error:", err);
    res.status(500).json({ success: false, message: "Could not fetch analytics" });
  }
});

// GET /api/owner/export-orders - Export orders to CSV
router.get("/export-orders", async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const query = {};
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Create CSV header
    const csvHeader = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Items',
      'Items Total',
      'Tax',
      'Shipping',
      'Discount',
      'Grand Total',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Tracking ID',
      'Shipping Address',
      'City',
      'State',
      'Pincode'
    ].join(',');

    // Create CSV rows
    const csvRows = orders.map(order => {
      const items = order.items.map(item => 
        `${item.name}(${item.quantity}x₹${item.pricePerUnit})`
      ).join('; ');
      
      const address = order.shippingAddress ? 
        `${order.shippingAddress.addressLine1 || ''} ${order.shippingAddress.addressLine2 || ''}`.trim() : '';

      return [
        order.orderId || order._id.toString(),
        order.createdAt.toISOString(),
        order.shippingAddress?.fullName || order.user?.name || '',
        order.user?.email || '',
        order.shippingAddress?.phone || order.user?.phone || '',
        `"${items.replace(/"/g, '""')}"`,
        order.itemsTotal,
        order.tax,
        order.shippingCharge,
        order.discount,
        order.grandTotal,
        order.paymentMethod,
        order.paymentStatus,
        order.status,
        order.trackingId || '',
        `"${address.replace(/"/g, '""')}"`,
        order.shippingAddress?.city || '',
        order.shippingAddress?.state || '',
        order.shippingAddress?.pincode || ''
      ].join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("Export orders error:", err);
    res.status(500).json({ success: false, message: "Could not export orders" });
  }
});

// GET /api/owner/activity-logs - View activity logs
router.get("/activity-logs", async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    
    const query = {};
    
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }
    
    if (userId) {
      query.user = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Activity logs error:", err);
    res.status(500).json({ success: false, message: "Could not fetch activity logs" });
  }
});

// GET /api/owner/stats - Quick stats summary
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      blockedUsers,
      pendingOrders
    ] = await Promise.all([
      User.countDocuments({}),
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } }
      ]),
      User.countDocuments({ isBlocked: true }),
      Order.countDocuments({ status: 'pending' })
    ]);

    // Orders today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          blocked: blockedUsers
        },
        orders: {
          total: totalOrders,
          today: ordersToday,
          pending: pendingOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0
        }
      }
    });
  } catch (err) {
    console.error("Owner stats error:", err);
    res.status(500).json({ success: false, message: "Could not fetch stats" });
  }
});

module.exports = router;

