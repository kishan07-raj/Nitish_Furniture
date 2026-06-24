import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Pre-defined room bundles
const ROOM_BUNDLES = [
  {
    id: "bedroom-starter",
    name: "Bedroom Starter Set",
    description: "Essential bedroom furniture for a complete look",
    image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&h=400&fit=crop",
    products: ["bed", "nightstand", "wardrobe"],
    discount: 15,
    savings: 15000
  },
  {
    id: "living-room-luxury",
    name: "Luxury Living Room",
    description: "Premium furniture for elegant living spaces",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
    products: ["sofa", "coffee-table", "tv-unit"],
    discount: 20,
    savings: 25000
  },
  {
    id: "dining-complete",
    name: "Dining Room Complete",
    description: "Everything you need for family dinners",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop",
    products: ["dining-table", "dining-chairs", "cabinet"],
    discount: 18,
    savings: 20000
  },
  {
    id: "home-office",
    name: "Home Office Setup",
    description: "Productive workspace solutions",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop",
    products: ["desk", "office-chair", "bookshelf"],
    discount: 12,
    savings: 10000
  }
];

export default function BundleBuilder({ 
  onBundleSelect,
  compact = false 
}) {
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [bundleProducts, setBundleProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch products for a bundle
  useEffect(() => {
    if (selectedBundle) {
      fetchBundleProducts(selectedBundle.products);
    }
  }, [selectedBundle]);

  const fetchBundleProducts = async (productTypes) => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      const products = data.products || data || [];
      
      // Get one product for each type
      const bundleItems = productTypes.map(type => {
        const product = products.find(p => 
          p.category?.toLowerCase().includes(type.toLowerCase()) ||
          p.name?.toLowerCase().includes(type.toLowerCase())
        );
        return product || null;
      }).filter(Boolean);

      setBundleProducts(bundleItems);
    } catch (err) {
      console.error("Failed to fetch bundle products", err);
      setBundleProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBundleSelect = (bundle) => {
    setSelectedBundle(bundle);
    onBundleSelect?.(bundle);
  };

  const calculateBundleTotal = () => {
    return bundleProducts.reduce((sum, p) => sum + (p.basePrice || p.price || 0), 0);
  };

  const calculateSavings = () => {
    if (!selectedBundle) return 0;
    return Math.round(calculateBundleTotal() * (selectedBundle.discount / 100));
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROOM_BUNDLES.slice(0, 4).map((bundle) => (
          <button
            key={bundle.id}
            onClick={() => handleBundleSelect(bundle)}
            className="relative group overflow-hidden rounded-xl"
          >
            <img
              src={bundle.image}
              alt={bundle.name}
              className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h4 className="text-white font-medium text-sm">{bundle.name}</h4>
              <p className="text-amber-400 text-xs font-bold">Save {bundle.discount}%</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bundle Selection */}
      <div>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-serif font-semibold text-neutral-900 dark:text-white mb-2">
            Smart Bundle Builder
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            Save up to 20% with curated furniture bundles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROOM_BUNDLES.map((bundle, index) => (
            <motion.button
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleBundleSelect(bundle)}
              className={`relative group overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                selectedBundle?.id === bundle.id
                  ? "ring-4 ring-amber-500"
                  : "hover:shadow-xl"
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={bundle.image}
                  alt={bundle.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="text-white font-semibold text-lg">{bundle.name}</h4>
                <p className="text-white/80 text-sm mb-2">{bundle.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Save {bundle.discount}%
                  </span>
                  <span className="text-white/60 text-xs">
                    ₹{bundle.savings.toLocaleString()} savings
                  </span>
                </div>
              </div>

              {/* Selected Check */}
              {selectedBundle?.id === bundle.id && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bundle Products Preview */}
      <AnimatePresence>
        {selectedBundle && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {selectedBundle.name}
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedBundle.products.length} items included
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBundle(null)}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Change Bundle
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl h-32 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bundleProducts.map((product, index) => (
                    <Link
                      key={product._id}
                      to={`/product/${product.slug}`}
                      className="bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={product.images?.[0] || "/assets/no-image.png"}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {product.name}
                        </h5>
                        <p className="text-sm font-bold text-amber-600">
                          ₹{(product.basePrice || product.price)?.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="mt-6 pt-6 border-t border-amber-200 dark:border-amber-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Bundle Price</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                        ₹{(calculateBundleTotal() - calculateSavings()).toLocaleString("en-IN")}
                      </span>
                      <span className="text-lg text-slate-400 line-through">
                        ₹{calculateBundleTotal().toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-medium">You Save</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{calculateSavings().toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="mt-4 w-full block text-center bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Add Bundle to Cart
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

