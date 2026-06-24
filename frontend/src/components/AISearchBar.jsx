import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Popular search suggestions
const SUGGESTIONS = [
  "Modern wooden sofa",
  "King size bed",
  "Dining table 6 seater",
  "Office desk",
  "Kids furniture",
  "Storage cabinet",
  "Mattress queen",
  "Coffee table"
];

// Price-based suggestions
const PRICE_SUGGESTIONS = [
  { query: "under 10000", label: "Under ₹10,000" },
  { query: "under 20000", label: "Under ₹20,000" },
  { query: "under 50000", label: "Under ₹50,000" },
  { query: "under 100000", label: "Under ₹1,00,000" }
];

// Category quick links
const CATEGORY_QUICK_LINKS = [
  { label: "Sofas", slug: "sofas" },
  { label: "Beds", slug: "beds" },
  { label: "Dining", slug: "dining" },
  { label: "Mattresses", slug: "mattress" },
  { label: "Office", slug: "office" },
  { label: "Storage", slug: "storage" }
];

export default function AISearchBar({ variant = "navbar", onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Parse natural language queries
  const parseQuery = (q) => {
    const lower = q.toLowerCase();
    const filters = {};
    
    // Extract price range
    const priceMatch = lower.match(/under\s*₹?(\d+)|₹?(\d+)\s*(?:or less|below|less)/);
    if (priceMatch) {
      filters.maxPrice = parseInt(priceMatch[1] || priceMatch[2]) * 1000;
    }
    
    // Extract category
    const categories = ["sofa", "bed", "dining", "table", "chair", "mattress", "cabinet", "wardrobe", "desk", "shelf"];
    for (const cat of categories) {
      if (lower.includes(cat)) {
        filters.category = cat;
        break;
      }
    }
    
    // Extract style
    if (lower.includes("modern")) filters.style = "modern";
    if (lower.includes("classic") || lower.includes("traditional")) filters.style = "traditional";
    if (lower.includes("luxury") || lower.includes("premium")) filters.style = "luxury";
    if (lower.includes("minimal")) filters.style = "minimal";
    
    // Extract material
    if (lower.includes("wood") || lower.includes("sheesham") || lower.includes("teak")) filters.material = "wood";
    if (lower.includes("metal") || lower.includes("steel")) filters.material = "metal";
    if (lower.includes("fabric") || lower.includes("leather")) filters.material = "upholstery";
    
    return filters;
  };

  // Search products
  const searchProducts = async (searchQuery) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowSuggestions(true);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const filters = parseQuery(searchQuery);
      let url = `/api/products/search?q=${encodeURIComponent(searchQuery)}`;
      
      if (filters.maxPrice) {
        url += `&maxPrice=${filters.maxPrice}`;
      }
      if (filters.category) {
        url += `&category=${filters.category}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      setResults(data.slice(0, 8));
      setShowResults(true);
    } catch (err) {
      console.error("Search failed", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchProducts(query);
      } else {
        setResults([]);
        setShowSuggestions(true);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/stores?search=${encodeURIComponent(query)}`);
      setShowResults(false);
      if (onClose) onClose();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    searchProducts(suggestion);
  };

  // Handle category click
  const handleCategoryClick = (slug) => {
    navigate(`/category/${slug}`);
    if (onClose) onClose();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const containerClass = variant === "navbar" 
    ? "relative w-full max-w-xl"
    : "relative w-full";

  const inputClass = variant === "navbar"
    ? "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 transition-all"
    : "w-full pl-14 pr-4 py-4 bg-white dark:bg-neutral-800 border-2 border-amber-600 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 shadow-lg";

  return (
    <div ref={inputRef} className={containerClass}>
      <form onSubmit={handleSubmit}>
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-slate-400 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search furniture... (Try 'modern sofa under 20000')"
          className={inputClass}
        />

        {/* Search Button */}
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${variant === "navbar" ? "hidden sm:block" : "hidden"}`}
        >
          <span className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors">
            Search
          </span>
        </button>
      </form>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-neutral-700 overflow-hidden z-50"
          >
            {results.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Products
                </div>
                {results.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product.slug}`}
                    onClick={() => {
                      setShowResults(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <img
                      src={product.images?.[0] || "/assets/no-image.png"}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-neutral-400">
                        {product.category}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      ₹{product.basePrice?.toLocaleString("en-IN")}
                    </span>
                  </Link>
                ))}
                
                <div className="border-t border-slate-100 dark:border-neutral-700 mt-2 pt-2">
                  <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-2 text-sm text-amber-700 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-neutral-700 font-medium text-center"
                  >
                    View all results for "{query}"
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="text-slate-400 dark:text-neutral-500 mb-2">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No products found</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  Try different keywords or browse categories
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Suggestions Dropdown (when no query) */}
        {showSuggestions && !query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-neutral-700 overflow-hidden z-50"
          >
            {/* Quick Categories */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-700">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_QUICK_LINKS.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Searches */}
            <div className="py-3">
              <div className="px-4 py-1 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Popular Searches
              </div>
              <div className="px-4 mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 text-sm text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-700/50 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="py-3 border-t border-slate-100 dark:border-neutral-700">
              <div className="px-4 py-1 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                Budget Shopping
              </div>
              <div className="px-4 mt-2 flex flex-wrap gap-2">
                {PRICE_SUGGESTIONS.map((item) => (
                  <button
                    key={item.query}
                    onClick={() => handleSuggestionClick(item.query)}
                    className="px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

