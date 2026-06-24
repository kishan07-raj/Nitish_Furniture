const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { emitNewOrder, emitOrderStatusUpdate } = require("../config/socket");
const { 
  sendOrderConfirmationEmail, 
  sendOwnerNotificationEmail,
  sendOrderCancellationEmail,
  sendOrderShippedEmail
} = require("../config/email");
const {
  createOrderValidation,
  orderIdValidation,
  cancelOrderValidation,
  updateOrderStatusValidation,
  userOrdersListValidation
} = require("../middleware/validation");

const router = express.Router();

// DEBUG MIDDLEWARE - Log all requests to order routes
router.use((req, res, next) => {
  console.log(`[ORDER ROUTE] ${req.method} ${req.path}`);
  next();
});

// Track order creation attempts to prevent duplicates
const pendingOrders = new Map();

// Generate unique order ID (ORD-2026-XXXXX format)
function generateOrderId() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${random}`;
}

// Calculate estimated delivery date (7-10 business days from now)
function calculateEstimatedDelivery() {
  const today = new Date();
  const deliveryDate = new Date(today);
  
  let daysToAdd = 7 + Math.floor(Math.random() * 4);
  
  while (daysToAdd > 0) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const day = deliveryDate.getDay();
    if (day !== 0 && day !== 6) {
      daysToAdd--;
    }
  }
  
  return deliveryDate;
}

// Generate tracking ID
function generateTrackingId() {
  const prefix = "NFH";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// DEBUG ROUTE: Get all orders from DB (for debugging)
router.get("/debug/all", protect, async (req, res) => {
  try {
    console.log("[DEBUG] /api/orders/debug/all HIT");
    console.log("[DEBUG] User:", req.user);
    
    const orders = await Order.find({}).limit(50).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      orders: orders.map(o => ({
        _id: o._id,
        orderId: o.orderId,
        user: o.user,
        status: o.status,
        grandTotal: o.grandTotal,
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    console.error("[DEBUG] Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DEBUG ROUTE: Get orders for current user with full details
router.get("/debug/my-orders", protect, async (req, res) => {
  try {
    console.log("[DEBUG] /api/orders/debug/my-orders HIT");
    console.log("[DEBUG] User ID:", req.user.id);
    console.log("[DEBUG] User Role:", req.user.role);
    
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log("[DEBUG] Found orders count:", orders.length);
    
    res.json({
      success: true,
      count: orders.length,
      userId: req.user.id,
      orders
    });
  } catch (err) {
    console.error("[DEBUG] Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders - Create order with stock validation
router.post("/", protect, createOrderValidation, async (req, res) => {
  console.log(">>> POST /api/orders HIT");
  console.log(">>> User from token:", req.user);

  try {
    const { items, totalAmount, shippingAddress, paymentMethod, orderSessionId, couponCode } = req.body;
    const userId = req.user.id;

    // DEBUG: Log incoming request
    console.log("[ORDER] Incoming body:", JSON.stringify({
      itemCount: items?.length,
      totalAmount,
      paymentMethod,
      orderSessionId,
      shippingAddress: shippingAddress ? { ...shippingAddress, phone: shippingAddress.phone ? '***' : undefined } : null
    }, null, 2));

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No items in order. Please add items to your cart." 
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({ 
        success: false,
        message: "Shipping address is required." 
      });
    }

    // Check for duplicate order submission
    if (orderSessionId) {
      const existingOrder = await Order.findOne({
        user: userId,
        orderSessionId: orderSessionId,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });

      if (existingOrder) {
        return res.status(200).json({
          success: true,
          order: existingOrder,
          message: "Order already submitted",
          isDuplicate: true
        });
      }
    }

    // Prevent rapid duplicate submissions
    if (pendingOrders.has(userId)) {
      const lastOrderTime = pendingOrders.get(userId);
      if (Date.now() - lastOrderTime < 5000) {
        return res.status(429).json({ 
          success: false,
          message: "Order already being processed. Please wait." 
        });
      }
    }
    pendingOrders.set(userId, Date.now());

    // Validate stock and get latest prices
    const orderItems = [];
    const outOfStockItems = [];

    for (const item of items) {
      let product = null;
      
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        product = await Product.findById(item.product);
      }
      
      if (!product && item.name) {
        const searchSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        product = await Product.findOne({ slug: searchSlug });
      }
      
      if (!product && item.name) {
        product = await Product.findOne({ name: { $regex: new RegExp(item.name, 'i') } });
      }
      
      if (!product) {
        console.warn(`Product not found in DB, using frontend data: ${item.name || item.product}`);
        const validatedPrice = item.pricePerUnit && item.pricePerUnit > 0 ? item.pricePerUnit : (item.price && item.price > 0 ? item.price : 0);
        const validatedQty = item.quantity && item.quantity > 0 ? item.quantity : (item.qty && item.qty > 0 ? item.qty : 1);
        
        orderItems.push({
          product: item.product && mongoose.Types.ObjectId.isValid(item.product) ? item.product : null,
          name: item.name || "Unknown Product",
          quantity: validatedQty,
          pricePerUnit: validatedPrice,
          image: item.image || ""
        });
        continue;
      }

      if (!product.inStock) {
        outOfStockItems.push(product.name);
        continue;
      }

      const validatedPrice = product.basePrice;
      const validatedQty = item.quantity && item.quantity > 0 ? item.quantity : (item.qty && item.qty > 0 ? item.qty : 1);
      
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: validatedQty,
        pricePerUnit: validatedPrice,
        image: product.images?.[0] || ""
      });
    }

    if (outOfStockItems.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Some items are out of stock: ${outOfStockItems.join(", ")}`,
        outOfStockItems
      });
    }

    // Allow orders with frontend data if DB products not found
    if (orderItems.length === 0 && items.length > 0) {
      console.warn("No products found in DB, using frontend cart data directly");
      for (const item of items) {
        const validatedQty = item.quantity && item.quantity > 0 ? item.quantity : (item.qty && item.qty > 0 ? item.qty : 1);
        orderItems.push({
          product: item.product && mongoose.Types.ObjectId.isValid(item.product) ? item.product : null,
          name: item.name || "Unknown Product",
          quantity: validatedQty,
          pricePerUnit: item.pricePerUnit || item.price || 0,
          image: item.image || ""
        });
      }
    }

    // Calculate totals server-side (ALWAYS trust server calculation)
    const itemsTotal = orderItems.reduce(
      (sum, item) => sum + item.pricePerUnit * item.quantity, 
      0
    );
    const shippingCharge = itemsTotal > 0 ? 199 : 0;
    const tax = Math.round(itemsTotal * 0.18); // 18% GST
    const grandTotal = itemsTotal + shippingCharge + tax;

    // Log for debugging but DON'T reject - server calculates the real total
    // Frontend may have different calculation (no tax), so we trust server
    if (totalAmount && Math.abs(grandTotal - totalAmount) > 10) {
      console.warn("Total calculation mismatch (using server total):", { 
        serverTotal: grandTotal, 
        clientTotal: totalAmount,
        itemsTotal,
        shippingCharge,
        tax
      });
      // Use server-calculated total, ignore frontend's totalAmount
    }
    
    // Use server-calculated grandTotal (this is the secure approach)
    const finalGrandTotal = grandTotal;

    // Generate unique order ID and estimated delivery
    const uniqueOrderId = generateOrderId();
    const estimatedDelivery = calculateEstimatedDelivery();

    // Map shipping address fields - convert from user address format to order format
    const orderShippingAddress = {
      fullName: shippingAddress.fullName || shippingAddress.name || "Customer",
      phone: shippingAddress.phone,
      email: shippingAddress.email || shippingAddress.emailAddress || "",
      addressLine1: shippingAddress.street || shippingAddress.addressLine1 || "",
      addressLine2: shippingAddress.addressLine2 || "",
      landmark: shippingAddress.landmark || "",
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode || shippingAddress.postalCode || "",
      country: shippingAddress.country || "India",
      addressType: shippingAddress.addressType || "Home"
    };

    // Initialize order timeline with first entry
    const initialTimeline = [{
      status: "pending",
      statusLabel: "Order Placed",
      timestamp: new Date(),
      updatedBy: null,
      updatedByName: "System",
      updatedByRole: "system",
      notes: "Order has been placed and is awaiting confirmation",
      isSystemUpdate: true
    }];

    // Create order - use the mapped address
    const order = await Order.create({
      orderId: uniqueOrderId,
      orderSessionId: orderSessionId || `session-${Date.now()}`,
      user: userId,
      items: orderItems,
      itemsTotal,
      discount: 0,
      tax,
      shippingFee: shippingCharge,
      shippingCharge,
      grandTotal,
      shippingAddress: orderShippingAddress,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "pending",
      orderStatus: "pending",
      status: "pending",
      estimatedDelivery,
      couponCode: couponCode || null,
      source: "web",
      orderTimeline: initialTimeline,
      deliveryStages: {}
    });

    // Clear user's cart and update loyalty points
    await Promise.all([
      User.findByIdAndUpdate(userId, { 
        cart: [],
        $inc: { loyaltyPoints: Math.floor(grandTotal / 100) } // 1 point per 100 rupees
      })
    ]);

    // Clean up pending order
    pendingOrders.delete(userId);

    // Emit Socket.io event
    emitNewOrder(order);

    // Populate user info
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone");

    // Send email confirmations (non-blocking)
    if (populatedOrder.user && populatedOrder.user.email) {
      sendOrderConfirmationEmail(
        populatedOrder, 
        populatedOrder.user.email, 
        populatedOrder.user.name || populatedOrder.shippingAddress?.fullName
      ).catch(err => console.error("Email send error:", err));
    }
    
    sendOwnerNotificationEmail(
      populatedOrder,
      populatedOrder.shippingAddress?.fullName || populatedOrder.user?.name
    ).catch(err => console.error("Owner email error:", err));

    res.status(201).json({
      success: true,
      order: populatedOrder,
      message: "Order placed successfully"
    });

  } catch (err) {
    console.error("ORDER ERROR:", err);
    
    let errorMessage = "Order creation failed. Please try again.";
    
    if (err.message && err.message.includes("Transaction numbers")) {
      errorMessage = "Server configuration issue. Please contact support.";
    } else if (err.name === "ValidationError") {
      errorMessage = "Invalid data provided. Please check your order details.";
    }
    
    if (req.user && req.user.id) {
      pendingOrders.delete(req.user.id);
    }
    
    res.status(400).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// GET /api/orders/my - Get user's orders
router.get("/my", protect, userOrdersListValidation, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = "newest", search } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "price-high") sortOption = { grandTotal: -1 };
    if (sort === "price-low") sortOption = { grandTotal: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product")
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
    res.status(500).json({ 
      success: false,
      message: "Failed to load orders" 
    });
  }
});

// Alias for /my-orders
router.get("/my-orders", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user.id })
        .populate("items.product")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments({ user: req.user.id })
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
    res.status(500).json({ 
      success: false,
      message: "Failed to load orders" 
    });
  }
});

// GET /api/orders/:id - Get single order
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    if (order.user._id.toString() !== req.user.id && !['admin', 'manager', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this order" 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Failed to load order" 
    });
  }
});

// ADMIN: GET /api/orders - Get all orders
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
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
    res.status(500).json({ 
      success: false,
      message: "Failed to load orders" 
    });
  }
});

// PUT /api/orders/:id/cancel - User cancels their order
router.put("/:id/cancel", protect, cancelOrderValidation, async (req, res) => {
  console.log(">>> PUT /api/orders/:id/cancel HIT");

  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id && !['admin', 'manager', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to cancel this order" 
      });
    }

    // Enterprise: Smart cancel policy - can cancel if status is pending OR confirmed
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot cancel order. Current status is "${order.status}". Only pending or confirmed orders can be cancelled.`
      });
    }

    // Check if already cancelled
    if (order.isCancelled) {
      return res.status(400).json({ 
        success: false,
        message: "Order is already cancelled" 
      });
    }

    // Update order to cancelled
    order.status = "cancelled";
    order.orderStatus = "cancelled";
    order.isCancelled = true;
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer";
    order.cancelledBy = req.user.id;

    await order.save();

    // Emit Socket.io event
    emitOrderStatusUpdate(order.user.toString(), {
      orderId: order._id,
      status: order.status,
      orderStatus: order.orderStatus,
      isCancelled: order.isCancelled,
      timestamp: new Date().toISOString()
    });

    // Send cancellation email
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email");
    
    if (populatedOrder.user && populatedOrder.user.email) {
      sendOrderCancellationEmail(
        populatedOrder,
        populatedOrder.user.email,
        populatedOrder.user.name
      ).catch(err => console.error("Cancellation email error:", err));
    }

    res.json({
      success: true,
      order,
      message: "Order cancelled successfully"
    });

  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to cancel order" 
    });
  }
});

// PUT /api/orders/:id/status - Update order status (admin)
router.put("/:id/status", protect, adminOnly, updateOrderStatusValidation, async (req, res) => {
  try {
    const { status, paymentStatus, trackingId, cancellationReason, returnReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded", "partially_refunded"];

    // Update status
    if (status && validStatuses.includes(status)) {
      // Prevent changing from cancelled to other states
      if (order.isCancelled && !['cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot change status of a cancelled order"
        });
      }

      order.status = status;
      
      // Update orderStatus based on status
      if (status === "cancelled") {
        order.orderStatus = "cancelled";
        order.isCancelled = true;
        order.cancelledAt = new Date();
        order.cancellationReason = cancellationReason || "Cancelled by admin";
        order.cancelledBy = req.user.id;
      } else if (status === "confirmed") {
        order.orderStatus = "confirmed";
      } else if (status === "shipped") {
        order.orderStatus = "shipped";
        // Auto-generate tracking ID if not provided
        order.trackingId = trackingId || generateTrackingId();
        order.trackingNumber = order.trackingId;
      } else if (status === "delivered") {
        order.orderStatus = "delivered";
        order.deliveredAt = new Date();
      } else if (status === "returned") {
        order.orderStatus = "returned";
        order.isReturned = true;
        order.returnedAt = new Date();
        order.returnReason = returnReason;
      } else {
        order.orderStatus = status;
      }
    }

    if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
    }

    if (trackingId) {
      order.trackingId = trackingId;
      order.trackingNumber = trackingId;
    }

    await order.save();

    // Emit Socket.io event
    emitOrderStatusUpdate(order.user.toString(), {
      orderId: order._id,
      status: order.status,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingId: order.trackingId,
      timestamp: new Date().toISOString()
    });

    // Send shipped email if status is shipped
    if (status === "shipped") {
      const populatedOrder = await Order.findById(order._id)
        .populate("user", "name email");
      
      if (populatedOrder.user && populatedOrder.user.email) {
        sendOrderShippedEmail(
          populatedOrder,
          populatedOrder.user.email,
          populatedOrder.user.name
        ).catch(err => console.error("Shipped email error:", err));
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone");

    res.json({
      success: true,
      order: populatedOrder,
      message: "Order status updated"
    });

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update order" 
    });
  }
});

// PUT /api/orders/:id/return - Request return (for delivered orders)
router.put("/:id/return", protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized" 
      });
    }

    // Can only return delivered orders
    if (order.status !== "delivered") {
      return res.status(400).json({ 
        success: false,
        message: "Can only request return for delivered orders" 
      });
    }

    // Check if already returned
    if (order.isReturned) {
      return res.status(400).json({ 
        success: false,
        message: "Order is already returned" 
      });
    }

    // Check return window (7 days from delivery)
    if (order.deliveredAt) {
      const returnWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
      const daysSinceDelivery = Date.now() - new Date(order.deliveredAt).getTime();
      
      if (daysSinceDelivery > returnWindow) {
        return res.status(400).json({ 
          success: false,
          message: "Return window has expired (7 days from delivery)" 
        });
      }
    }

    order.status = "returned";
    order.orderStatus = "returned";
    order.isReturned = true;
    order.returnedAt = new Date();
    order.returnReason = reason || "Customer requested return";

    await order.save();

    res.json({
      success: true,
      order,
      message: "Return request submitted successfully"
    });

  } catch (err) {
    console.error("Return request error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit return request" 
    });
  }
});

// PUT /api/orders/:id/edit - Admin/Owner edits order (address, quantity, price)
router.put("/:id/edit", protect, async (req, res) => {
  try {
    const { shippingAddress, items, notes, adjustPrice, priceOverride } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Check authorization (admin/owner can edit)
    const isAdmin = ['admin', 'owner'].includes(req.user.role);
    const isOwner = req.user.role === 'owner';
    
    if (!isAdmin && order.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to edit this order" 
      });
    }

    // Check if order can be edited (not shipped or delivered)
    const nonEditableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (nonEditableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot edit order. Current status is "${order.status}"` 
      });
    }

    // Edit shipping address (before shipped)
    if (shippingAddress && !['shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
      if (shippingAddress.fullName) order.shippingAddress.fullName = shippingAddress.fullName;
      if (shippingAddress.phone) order.shippingAddress.phone = shippingAddress.phone;
      if (shippingAddress.addressLine1) order.shippingAddress.addressLine1 = shippingAddress.addressLine1;
      if (shippingAddress.addressLine2 !== undefined) order.shippingAddress.addressLine2 = shippingAddress.addressLine2;
      if (shippingAddress.landmark !== undefined) order.shippingAddress.landmark = shippingAddress.landmark;
      if (shippingAddress.city) order.shippingAddress.city = shippingAddress.city;
      if (shippingAddress.state) order.shippingAddress.state = shippingAddress.state;
      if (shippingAddress.pincode) order.shippingAddress.pincode = shippingAddress.pincode;
      if (shippingAddress.country) order.shippingAddress.country = shippingAddress.country;
    }

    // Edit quantity (before processing)
    if (items && !['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: "Items must be a non-empty array" 
        });
      }

      // Recalculate totals
      let newItemsTotal = 0;
      order.items = items.map(item => {
        const itemSubtotal = (item.pricePerUnit || 0) * (item.quantity || 0);
        newItemsTotal += itemSubtotal;
        return {
          ...item,
          subtotal: itemSubtotal
        };
      });

      order.itemsTotal = newItemsTotal;
      order.grandTotal = newItemsTotal + (order.tax || 0) + (order.shippingFee || 0) + (order.shippingCharge || 0) - (order.discount || 0);
    }

    // Adjust price - Owner only
    if ((adjustPrice !== undefined || priceOverride !== undefined) && isOwner) {
      if (adjustPrice) {
        order.discount = (order.discount || 0) + adjustPrice;
      }
      if (priceOverride !== undefined) {
        order.grandTotal = priceOverride;
      }
    } else if ((adjustPrice !== undefined || priceOverride !== undefined) && !isOwner) {
      return res.status(403).json({ 
        success: false,
        message: "Only owner can adjust prices" 
      });
    }

    // Edit notes
    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email phone");

    res.json({
      success: true,
      order: populatedOrder,
      message: "Order updated successfully"
    });

  } catch (err) {
    console.error("Edit order error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to edit order" 
    });
  }
});

// PUT /api/orders/:id/refund - Request refund (for cancelled orders with payment)
router.put("/:id/refund", protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Check authorization
    if (order.user.toString() !== req.user.id && !['admin', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized" 
      });
    }

    // Can only refund cancelled orders that were paid
    if (!order.isCancelled) {
      return res.status(400).json({ 
        success: false,
        message: "Can only request refund for cancelled orders" 
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ 
        success: false,
        message: "Order was not paid, no refund available" 
      });
    }

    // Check if already refunded
    if (order.isRefunded) {
      return res.status(400).json({ 
        success: false,
        message: "Order is already refunded" 
      });
    }

    // Check if refund already requested
    if (order.refundRequestAt) {
      return res.status(400).json({ 
        success: false,
        message: "Refund request already submitted" 
      });
    }

    order.refundRequestAt = new Date();
    order.refundReason = reason || "Customer requested refund";

    await order.save();

    res.json({
      success: true,
      order,
      message: "Refund request submitted successfully"
    });

  } catch (err) {
    console.error("Refund request error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit refund request" 
    });
  }
});

module.exports = router;

