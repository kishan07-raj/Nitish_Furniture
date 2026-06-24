const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// AI-Powered Product Recommendations
router.get("/", async (req, res) => {
  try {
    const type = req.query.type || "trending";
    const limit = parseInt(req.query.limit) || 8;
    const exclude = req.query.exclude;

    let products = await Product.find({ inStock: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(50);

    let recommendations = [];

    switch (type) {
      case "trending":
        recommendations = products
          .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, limit);
        break;

      case "new-arrivals":
        recommendations = products.slice(0, limit);
        break;

      case "under-budget":
        const budget = parseInt(req.query.budget) || 50000;
        recommendations = products
          .filter(p => (p.basePrice || 0) <= budget)
          .sort((a, b) => a.basePrice - b.basePrice)
          .slice(0, limit);
        break;

      case "browsing":
        const categories = req.query.categories ? req.query.categories.split(",") : [];
        if (categories.length > 0) {
          recommendations = products
            .filter(p => categories.includes(p.category))
            .slice(0, limit);
        } else {
          recommendations = products.slice(0, limit);
        }
        break;

      case "similar":
        const productId = req.query.productId;
        if (productId) {
          const currentProduct = products.find(p => p._id.toString() === productId);
          if (currentProduct) {
            recommendations = products
              .filter(p => 
                p._id.toString() !== productId &&
                (p.category === currentProduct.category ||
                 (p.tags && currentProduct.tags && p.tags.some(t => currentProduct.tags.includes(t))))
              )
              .slice(0, limit);
          }
        }
        if (!recommendations.length) {
          recommendations = products.slice(0, limit);
        }
        break;

      default:
        recommendations = products.slice(0, limit);
    }

    // Exclude specific products if provided
    if (exclude) {
      const excludeIds = exclude.split(",");
      recommendations = recommendations.filter(p => !excludeIds.includes(p._id.toString()));
    }

    res.json({ products: recommendations, type });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
});

// Natural language search
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    const filters = parseQuery(q);
    let query = {};

    // Category filter
    const categories = ["sofa", "bed", "dining", "table", "chair", "mattress", "cabinet", "wardrobe", "desk", "shelf", "storage"];
    const matchedCategory = categories.find(c => q.toLowerCase().includes(c));
    if (matchedCategory) {
      query.category = { $regex: matchedCategory, $options: "i" };
    }

    // Price filter
    if (filters.maxPrice) {
      query.basePrice = { $lte: filters.maxPrice };
    }
    if (filters.minPrice) {
      query.basePrice = { ...query.basePrice, $gte: filters.minPrice };
    }

    // Style filter
    if (filters.style) {
      query.style = { $regex: filters.style, $options: "i" };
    }

    // Material filter
    if (filters.material) {
      query.tags = { $regex: filters.material, $options: "i" };
    }

    const products = await Product.find(query)
      .sort({ reviewCount: -1, averageRating: -1 })
      .limit(20);

    res.json({ 
      products, 
      filters,
      originalQuery: q 
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
});

// Helper function to parse natural language queries
function parseQuery(q) {
  const lower = q.toLowerCase();
  const filters = {};

  // Extract price range
  const priceMatch = lower.match(/under\s*₹?(\d+)|₹?(\d+)\s*(?:or less|below|less)/);
  if (priceMatch) {
    filters.maxPrice = parseInt(priceMatch[1] || priceMatch[2]) * 1000;
  }

  // Extract minimum price
  const minPriceMatch = lower.match(/above\s*₹?(\d+)|₹?(\d+)\s*(?:or more|over)/);
  if (minPriceMatch) {
    filters.minPrice = parseInt(minPriceMatch[1] || minPriceMatch[2]) * 1000;
  }

  // Extract style
  if (lower.includes("modern")) filters.style = "modern";
  if (lower.includes("classic") || lower.includes("traditional")) filters.style = "traditional";
  if (lower.includes("luxury") || lower.includes("premium")) filters.style = "luxury";
  if (lower.includes("minimal")) filters.style = "minimal";
  if (lower.includes("contemporary")) filters.style = "contemporary";

  // Extract material
  if (lower.includes("wood") || lower.includes("sheesham") || lower.includes("teak")) filters.material = "wood";
  if (lower.includes("metal") || lower.includes("steel")) filters.material = "metal";
  if (lower.includes("fabric") || lower.includes("leather")) filters.material = "upholstery";

  return filters;
}

// Mood-based recommendations
router.get("/mood/:mood", async (req, res) => {
  try {
    const mood = req.params.mood;
    const limit = parseInt(req.query.limit) || 8;

    const moodMap = {
      modern: { tags: ["modern", "contemporary", "minimal"] },
      luxury: { tags: ["luxury", "premium", "elegant"] },
      minimal: { tags: ["minimal", "simple", "basic"] },
      royal: { tags: ["traditional", "classic", "heritage"] },
      bohemian: { tags: ["natural", "artistic", "organic"] },
      industrial: { tags: ["rustic", "urban", "vintage"] }
    };

    const moodFilters = moodMap[mood.toLowerCase()];
    
    if (!moodFilters) {
      return res.status(400).json({ message: "Invalid mood" });
    }

    const products = await Product.find({
      $or: [
        { style: { $regex: moodFilters.tags.join("|"), $options: "i" } },
        { tags: { $in: moodFilters.tags } }
      ]
    })
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(limit);

    res.json({ products, mood });
  } catch (error) {
    console.error("Mood recommendation error:", error);
    res.status(500).json({ message: "Failed to get mood recommendations" });
  }
});

module.exports = router;

