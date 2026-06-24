import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MAX_ITEMS = 8;

export default function RecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    // Get recently viewed from localStorage
    const stored = localStorage.getItem("nf_recently_viewed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentProducts(parsed.slice(0, MAX_ITEMS));
      } catch (e) {
        console.error("Failed to parse recently viewed", e);
      }
    }
  }, []);

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-12 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-neutral-900 dark:text-white">
              Recently Viewed
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Pick up where you left off
            </p>
          </div>
          <Link
            to="/products"
            className="text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-sm font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentProducts.map((product, index) => (
            <motion.div
              key={product._id || product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/product/${product.slug}`}
                className="group block bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-slate-100 dark:border-neutral-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.imageUrl || product.images?.[0] || "/assets/no-image.png"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1">
                    ₹{(product.price || product.basePrice)?.toLocaleString("en-IN")}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Helper function to add a product to recently viewed
export function addToRecentlyViewed(product) {
  const stored = localStorage.getItem("nf_recently_viewed");
  let recent = [];
  
  if (stored) {
    try {
      recent = JSON.parse(stored);
    } catch (e) {
      recent = [];
    }
  }

  // Remove if already exists
  recent = recent.filter(p => (p._id || p.id) !== (product._id || product.id));
  
  // Add to beginning
  recent.unshift({
    _id: product._id,
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price || product.basePrice,
    imageUrl: product.images?.[0] || product.imageUrl
  });
  
  // Keep only MAX_ITEMS
  recent = recent.slice(0, MAX_ITEMS);
  
  localStorage.setItem("nf_recently_viewed", JSON.stringify(recent));
}

