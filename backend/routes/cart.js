// backend/routes/cart.js
const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/cart - Get user's cart
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Convert to format frontend expects
    const items = (user.cart || []).map(item => ({
      _id: item._id,
      productId: item.product?._id || item.product,
      qty: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image
    }));
    res.json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/cart/totals - Get calculated totals with tax (server-side)
router.get("/totals", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItems = user.cart || [];
    
    // Calculate totals server-side (same logic as order creation)
    const itemsTotal = cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
    const shippingCharge = itemsTotal > 0 ? 199 : 0;
    const tax = Math.round(itemsTotal * 0.18); // 18% GST
    const grandTotal = itemsTotal + shippingCharge + tax;

    res.json({
      success: true,
      items: cartItems.length,
      itemsTotal,
      shippingCharge,
      tax,
      grandTotal
    });
  } catch (error) {
    console.error("Error calculating totals:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cart/add - Add product to cart
router.post("/add", protect, async (req, res) => {
  try {
    const { productId, qty = 1, price, name, image } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize cart if not exists
    if (!user.cart) {
      user.cart = [];
    }

    // Check if product already in cart
    const existingItemIndex = user.cart.findIndex(
      (item) => 
        item.product?.toString() === productId ||
        item.productId === productId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      user.cart[existingItemIndex].quantity = (user.cart[existingItemIndex].quantity || 1) + qty;
    } else {
      // Add new item
      user.cart.push({
        product: productId,
        quantity: qty,
        price: price || 0,
        name: name || "",
        image: image || ""
      });
    }

    await user.save();
    const items = user.cart.map(item => ({
      _id: item._id,
      productId: item.product?._id || item.product,
      qty: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image
    }));
    res.json({ items });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/cart/update - Update cart item quantity
router.put("/update", protect, async (req, res) => {
  try {
    const { productId, qty } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const itemIndex = user.cart.findIndex(
      (item) => 
        item.product?.toString() === productId ||
        item.productId === productId
    );

    if (itemIndex >= 0) {
      user.cart[itemIndex].quantity = qty;
      await user.save();
      const items = user.cart.map(item => ({
        _id: item._id,
        productId: item.product?._id || item.product,
        qty: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image
      }));
      res.json({ items });
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart/remove/:productId - Remove product from cart
router.delete("/remove/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = user.cart.filter(
      (item) => 
        item.product?.toString() !== productId &&
        item.productId !== productId
    );

    await user.save();
    const items = user.cart.map(item => ({
      _id: item._id,
      productId: item.product?._id || item.product,
      qty: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image
    }));
    res.json({ items });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart/clear - Clear entire cart
router.delete("/clear", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = [];
    await user.save();
    res.json({ items: [] });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cart/sync - Sync local cart with server cart
router.post("/sync", protect, async (req, res) => {
  try {
    const { items } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.cart) {
      user.cart = [];
    }

    if (items && Array.isArray(items)) {
      items.forEach(localItem => {
        const productId = localItem._id || localItem.id || localItem.productId;
        
        const existingIndex = user.cart.findIndex(
          serverItem => 
            serverItem.product?.toString() === productId ||
            serverItem.productId === productId
        );

        if (existingIndex >= 0) {
          user.cart[existingIndex].quantity = Math.max(
            user.cart[existingIndex].quantity || 1,
            localItem.qty || localItem.quantity || 1
          );
        } else {
          user.cart.push({
            product: productId,
            quantity: localItem.qty || localItem.quantity || 1,
            price: localItem.price || 0,
            name: localItem.name || "",
            image: localItem.image || ""
          });
        }
      });
    }

    await user.save();
    const syncedItems = user.cart.map(item => ({
      _id: item._id,
      productId: item.product?._id || item.product,
      qty: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image
    }));
    res.json({ items: syncedItems });
  } catch (error) {
    console.error("Error syncing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
