const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { uploadImages } = require("../middleware/upload");
const Product = require("../models/Product");



const router = express.Router();

// GET /api/admin/products - Get all products with pagination and search
router.get("/", protect, adminOnly, async (req, res) => {

  try {
    const { page = 1, limit = 20, search, category } = req.query;
    
    const query = {};
    
    // Search by name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Admin products list error:", err);
    res.status(500).json({ success: false, message: "Could not fetch products" });
  }
});

// GET /api/admin/products/:id - Get single product
router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    console.error("Admin product detail error:", err);
    res.status(500).json({ success: false, message: "Could not fetch product" });
  }
});

// POST /api/admin/products - Create new product (multipart with images[])
router.post(
  "/",
  protect,
  adminOnly,
  uploadImages.array("images", 10),
  async (req, res) => {
    try {
      const body = req.body || {};

      // Convert numeric fields from multipart strings
      const price = body.price !== undefined && body.price !== "" ? Number(body.price) : undefined;
      const stock = body.stock !== undefined && body.stock !== "" ? Number(body.stock) : undefined;
      const featured = body.featured === "true" || body.featured === true;

      const images = (req.files || []).map((f) => `/uploads/${f.filename}`);

      const payload = {
        ...body,
        price: price,
        stock: stock,
        featured,
        images,
      };

      // Note: Product schema uses `basePrice` / `inStock`.
      // Existing admin UI may send `price` / `stock`.
      // Map to schema fields when present.
      if (payload.price !== undefined) payload.basePrice = payload.price;
      if (payload.stock !== undefined) payload.inStock = payload.stock > 0;

      delete payload.price;
      delete payload.stock;

      const product = await Product.create(payload);
      res.status(201).json({ success: true, product });
    } catch (err) {
      console.error("Admin create product error:", err);
      res.status(500).json({ success: false, message: "Could not create product" });
    }
  }
);

// PUT /api/admin/products/:id - Update product (multipart with images[])
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadImages.array("images", 10),
  async (req, res) => {
    try {
      const body = req.body || {};

      const update = { ...body };

      const price = body.price !== undefined && body.price !== "" ? Number(body.price) : undefined;
      const stock = body.stock !== undefined && body.stock !== "" ? Number(body.stock) : undefined;
      const featured = body.featured === "true" || body.featured === true;

      const images = (req.files || []).map((f) => `/uploads/${f.filename}`);

      // Map UI fields -> schema fields
      if (price !== undefined) update.basePrice = price;
      if (stock !== undefined) update.inStock = stock > 0;

      if (body.featured !== undefined) update.featured = featured;

      // If new images uploaded, replace. If none, keep existing.
      if (images.length > 0) update.images = images;

      delete update.price;
      delete update.stock;

      const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, product: updated });
    } catch (err) {
      console.error("Admin update product error:", err);
      res.status(500).json({ success: false, message: "Could not update product" });
    }
  }
);


// DELETE /api/admin/products/:id - Delete product
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("Admin delete product error:", err);
    res.status(500).json({ success: false, message: "Could not delete product" });
  }
});

module.exports = router;
