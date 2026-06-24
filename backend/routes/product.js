// backend/routes/product.js
const express = require("express");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/products  (list, optional category)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const products = await Product.find(filter).limit(100);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to load products" });
  }
});

// GET /api/products/search  (search by query)
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, "i"); // case-insensitive
    const products = await Product.find({
      $or: [
        { name: regex },
        { category: regex },
        { description: regex },
        { shortDescription: regex }
      ]
    }).limit(20); // limit results for performance

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});

// GET /api/products/category/:slug
router.get("/category/:slug", async (req, res) => {
  try {
    const products = await Product.find({ categorySlug: req.params.slug });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to load category products" });
  }
});

// GET /api/products/:slug
router.get("/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to load product" });
  }
});

// ADMIN: POST /api/products
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: "Product creation failed" });
  }
});

// ADMIN: PUT /api/products/:id
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Product update failed" });
  }
});

// ADMIN: DELETE /api/products/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ message: "Product delete failed" });
  }
});

module.exports = router;
