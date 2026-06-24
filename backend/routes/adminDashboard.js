const express = require("express");
const { protect, adminOnly, ownerOnly } = require("../middleware/authMiddleware");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

const router = express.Router();

// GET /api/admin/products/stats - Product statistics
router.get("/products/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });
    const outOfStock = await Product.countDocuments({ stock: { $lte: 0 } });
    const featuredProducts = await Product.countDocuments({ featured: true });

    res.json({
      success: true,
      stats: {
        totalProducts,
        lowStockProducts,
        outOfStock,
        featuredProducts
      }
    });
  } catch (err) {
    console.error("Product stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/admin/orders/stats - Order statistics
router.get("/orders/stats", protect, adminOnly, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = new Date();
    if (period === 'day') {
      dateFilter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === 'year') {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: dateFilter }
    });

    const pendingOrders = await Order.countDocuments({
      status: 'pending',
      createdAt: { $gte: dateFilter }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusObj = {};
    ordersByStatus.forEach(item => {
      statusObj[item._id] = item.count;
    });

    const revenueResult = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: 'cancelled' },
          paymentStatus: 'paid',
          createdAt: { $gte: dateFilter }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        todayOrders,
        totalRevenue: revenueResult[0]?.total || 0,
        ordersByStatus: statusObj
      }
    });
  } catch (err) {
    console.error("Order stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/admin/orders/revenue - Revenue data for charts
router.get("/orders/revenue", protect, adminOnly, async (req, res) => {
  try {
    const { groupBy = 'day', period = 'month' } = req.query;
    
    let dateFilter = new Date();
    if (period === 'day') {
      dateFilter.setDate(dateFilter.getDate() - 1);
    } else if (period === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === 'year') {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    let groupFormat;
    if (groupBy === 'day') {
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (groupBy === 'month') {
      groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const revenue = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: 'cancelled' },
          paymentStatus: 'paid',
          createdAt: { $gte: dateFilter }
        } 
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    res.json({
      success: true,
      revenue
    });
  } catch (err) {
    console.error("Revenue stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/admin/users/stats - User statistics
router.get("/users/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: monthStart }
    });

    const blockedUsers = await User.countDocuments({ isBlocked: true });

    // Calculate conversion rate (users with orders / total users)
    const usersWithOrders = await Order.distinct('user');
    const conversionRate = totalUsers > 0 ? ((usersWithOrders.length / totalUsers) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        newUsersThisMonth,
        blockedUsers,
        conversionRate
      }
    });
  } catch (err) {
    console.error("User stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/admin/analytics/sales-by-category
router.get("/analytics/sales-by-category", protect, adminOnly, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = new Date();
    if (period === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === 'year') {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    const salesByCategory = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFilter }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$items.pricePerUnit', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      data: salesByCategory
    });
  } catch (err) {
    console.error("Sales by category error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/admin/analytics/top-products
router.get("/analytics/top-products", protect, adminOnly, async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    
    let dateFilter = new Date();
    if (period === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === 'year') {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFilter }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.productName' },
          revenue: { $sum: { $multiply: ['$items.pricePerUnit', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      products: topProducts
    });
  } catch (err) {
    console.error("Top products error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
