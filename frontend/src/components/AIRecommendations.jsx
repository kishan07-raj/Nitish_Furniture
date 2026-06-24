import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

// Recommendation types
const RECOMMENDATION_TYPES = [
  { id: "trending", label: "Trending Now", icon: "🔥" },
  { id: "browsing", label: "Based on Your Browsing", icon: "👁️" },
  { id: "similar", label: "Similar to What You Liked", icon: "✨" },
  { id: "bought-together", label: "Frequently Bought Together", icon: "🤝" },
  { id: "new-arrivals", label: "New Arrivals", icon: "🆕" },
  { id: "under-budget", label: "Under Your Budget", icon: "💰" }
];

export default function AIRecommendations({ 
  title = "Recommended For You",
  type = "trending",
  limit = 8,
  excludeIds = [],
  onProductClick
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState(type);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendations();
  }, [activeType, limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Try to fetch from API
      const res = await fetch(`/api/products/recommendations?type=${activeType}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data);
      } else {
        // Fallback: fetch all products and filter client-side
        const allRes = await fetch("/api/products");
        const allData = await allRes.json();
        let filtered = allData.products || allData || [];
        
        // Filter out excluded products
        if (excludeIds.length > 0) {
          filtered = filtered.filter(p => !excludeIds.includes(p._id));
        }
        
        // Apply recommendation logic based on type
        filtered = applyRecommendationLogic(filtered, activeType);
        
        setProducts(filtered.slice(0, limit));
      }
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side recommendation logic
  const applyRecommendationLogic = (products, recType) => {
    switch (recType) {
      case "trending":
        // Sort by rating and review count
        return [...products]
          .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, limit);
      
      case "new-arrivals":
        // Sort by creation date (newest first)
        return [...products]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, limit);
      
      case "under-budget":
        // Get user's budget from localStorage or use default
        const budget = parseInt(localStorage.getItem("nf_budget") || "50000");
        return products
          .filter(p => (p.basePrice || p.price) <= budget)
          .sort((a, b) => a.basePrice - b.basePrice)
          .slice(0, limit);
      
      case "browsing":
        // Get recently viewed from localStorage
        const viewed = JSON.parse(localStorage.getItem("nf_recently_viewed") || "[]");
        if (viewed.length === 0) {
          // Fallback to trending if no browsing history
          return applyRecommendationLogic(products, "trending");
        }
        // Find products in same category as recently viewed
        const viewedCategories = viewed.slice(0, 3).map(v => v.category).filter(Boolean);
        return products
          .filter(p => viewedCategories.includes(p.category))
          .slice(0, limit);
      
      case "similar":
        // Get from wishlist or browsing history
        const wishlist = JSON.parse(localStorage.getItem("nf_wishlist") || "[]");
        const viewedProducts = JSON.parse(localStorage.getItem("nf_recently_viewed") || "[]");
        const interestCategories = [...new Set([
          ...wishlist.map(w => w.category),
          ...viewedProducts.map(v => v.category)
        ])].filter(Boolean);
        
        if (interestCategories.length === 0) {
          return applyRecommendationLogic(products, "trending");
        }
        
        return products
          .filter(p => interestCategories.includes(p.category))
          .slice(0, limit);
      
      case "bought-together":
        // Return products commonly bought together (simulated)
        return products.slice(0, limit);
      
      default:
        return products.slice(0, limit);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-neutral-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-100 dark:bg-neutral-800 rounded-xl h-72"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-serif font-semibold text-neutral-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              AI-Powered Personalized Recommendations
            </p>
          </div>
        </div>
        
        <Link
          to="/stores"
          className="text-sm text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium flex items-center gap-1"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Recommendation Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {RECOMMENDATION_TYPES.map((recType) => (
          <button
            key={recType.id}
            onClick={() => setActiveType(recType.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeType === recType.id
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25"
                : "bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-600"
            }`}
          >
            <span>{recType.icon}</span>
            <span className="hidden sm:inline">{recType.label}</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard key={product._id} product={product} index={index} onClick={onProductClick} />
        ))}
      </div>
    </section>
  );
}

// Product Card Component
function ProductCard({ product, index, onClick }) {
  const discount = product.discount || Math.floor(Math.random() * 20) + 5;
  const rating = product.averageRating || product.rating || 4.5;
  const reviews = product.reviewCount || Math.floor(Math.random() * 50) + 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/product/${product.slug}`}
        onClick={onClick}
        className="group block bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-neutral-700 hover:shadow-xl hover:border-amber-200 dark:hover:border-amber-600 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={product.images?.[0] || product.imageUrl || "/assets/no-image.png"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              -{discount}%
            </div>
          )}

          {/* AI Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full flex items-center gap-1">
            <span>✨</span>
            <span>AI Pick</span>
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-full py-2 bg-white/95 backdrop-blur-sm text-neutral-900 text-sm font-medium rounded-lg hover:bg-white transition-colors">
              Quick View
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2">
            <div className="flex text-amber-400 text-xs">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(rating) ? "text-amber-400" : "text-slate-300"}>★</span>
              ))}
            </div>
            <span className="text-xs text-slate-500">({reviews})</span>
          </div>

          {/* Price */}
          <div className="mt-2">
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              ₹{(product.basePrice || product.price)?.toLocaleString("en-IN")}
            </span>
            {product.mrp && (
              <span className="ml-2 text-sm text-slate-400 line-through">
                ₹{product.mrp.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Tags */}
          {product.featured && (
            <div className="mt-2">
              <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                Best Seller
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Hook for getting user preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({
    favoriteCategories: [],
    priceRange: { min: 0, max: 100000 },
    browsingHistory: [],
    wishlistCategories: []
  });

  useEffect(() => {
    // Load from localStorage
    const history = JSON.parse(localStorage.getItem("nf_recently_viewed") || "[]");
    const wishlist = JSON.parse(localStorage.getItem("nf_wishlist") || "[]");
    const budget = localStorage.getItem("nf_budget") || "50000";

    const historyCategories = [...new Set(history.map(h => h.category).filter(Boolean))];
    const wishlistCategories = [...new Set(wishlist.map(w => w.category).filter(Boolean))];

    setPreferences({
      favoriteCategories: [...new Set([...historyCategories, ...wishlistCategories])],
      priceRange: { min: 0, max: parseInt(budget) },
      browsingHistory: history.slice(0, 10),
      wishlistCategories
    });
  }, []);

  return preferences;
}

