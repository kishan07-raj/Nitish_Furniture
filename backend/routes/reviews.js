const express = require("express");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/reviews/product/:productId - Get reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reviews/user - Get user's reviews
router.get("/user", protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/reviews - Create a new review
router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, title, comment, images } = req.body;

    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user has purchased the product (for verified reviews)
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      "items.product": productId,
      status: "delivered"
    });

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating,
      title,
      comment,
      images: images || [],
      verified: !!hasPurchased,
    });

    await review.populate("user", "name");

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/reviews/:id - Update a review
router.put("/:id", protect, async (req, res) => {
  try {
    const { rating, title, comment, images } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    await review.save();
    await review.populate("user", "name");

    res.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await review.remove();
    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
