import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRICE_RANGES = [
  { label: "Under ₹10,000", min: 0, max: 10000 },
  { label: "₹10,000 - ₹25,000", min: 10000, max: 25000 },
  { label: "₹25,000 - ₹50,000", min: 25000, max: 50000 },
  { label: "₹50,000 - ₹1,00,000", min: 50000, max: 100000 },
  { label: "Above ₹1,00,000", min: 100000, max: Infinity }
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "discount", label: "Best Discount" }
];

export default function SmartFilters({ 
  onFilterChange, 
  initialFilters = {},
  categories = [],
  materials = [],
  sizes = []
}) {
  const [filters, setFilters] = useState({
    priceRange: initialFilters.priceRange || null,
    categories: initialFilters.categories || [],
    materials: initialFilters.materials || [],
    sizes: initialFilters.sizes || [],
    rating: initialFilters.rating || 0,
    sortBy: initialFilters.sortBy || "relevance",
    inStock: initialFilters.inStock || false,
    onSale: initialFilters.onSale || false
  });

  const [priceInput, setPriceInput] = useState({
    min: initialFilters.priceMin || "",
    max: initialFilters.priceMax || ""
  });

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handlePriceRangeClick = (range) => {
    setFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange?.label === range.label ? null : range,
      priceMin: range.min,
      priceMax: range.max === Infinity ? "" : range.max
    }));
  };

  const handleCustomPriceChange = (type, value) => {
    setPriceInput(prev => ({ ...prev, [type]: value }));
    if (value) {
      setFilters(prev => ({
        ...prev,
        priceRange: null,
        priceMin: type === "min" ? parseInt(value) : prev.priceMin,
        priceMax: type === "max" ? parseInt(value) : prev.priceMax
      }));
    }
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => {
      const arr = prev[key];
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  const handleRatingChange = (rating) => {
    setFilters(prev => ({
      ...prev,
      rating: prev.rating === rating ? 0 : rating
    }));
  };

  const handleSortChange = (sortBy) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: null,
      categories: [],
      materials: [],
      sizes: [],
      rating: 0,
      sortBy: "relevance",
      inStock: false,
      onSale: false
    });
    setPriceInput({ min: "", max: "" });
  };

  const hasActiveFilters = 
    filters.priceRange || 
    filters.categories.length > 0 || 
    filters.materials.length > 0 || 
    filters.sizes.length > 0 || 
    filters.rating > 0 ||
    filters.inStock ||
    filters.onSale;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-slate-100 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-semibold text-neutral-900 dark:text-white">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-700">
        <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="mt-2 w-full px-3 py-2 bg-slate-50 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 dark:border-neutral-700">
        <div className="flex">
          {["all", "price", "category", "rating"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-amber-700 dark:text-amber-400 border-b-2 border-amber-600"
                  : "text-slate-500 dark:text-neutral-400 hover:text-neutral-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* All Tab */}
          {activeTab === "all" && (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Price Quick Select */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Price Range
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PRICE_RANGES.slice(0, 4).map(range => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceRangeClick(range)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                        filters.priceRange?.label === range.label
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-slate-50 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-600 hover:border-amber-400"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Categories
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(showAllCategories ? categories : categories.slice(0, 6)).map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleArrayFilter("categories", cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          filters.categories.includes(cat)
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-slate-50 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-600 hover:border-amber-400"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    {categories.length > 6 && (
                      <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-600"
                      >
                        {showAllCategories ? "Show Less" : `+${categories.length - 6} More`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Filters */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Quick Filters
                </label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-neutral-300">In Stock Only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.onSale}
                      onChange={(e) => setFilters(prev => ({ ...prev, onSale: e.target.checked }))}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-neutral-300">On Sale</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Price Tab */}
          {activeTab === "price" && (
            <motion.div
              key="price"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Custom Price Range
                </label>
                <div className="mt-2 flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceInput.min}
                      onChange={(e) => handleCustomPriceChange("min", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded-lg text-sm dark:text-white"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceInput.max}
                      onChange={(e) => handleCustomPriceChange("max", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded-lg text-sm dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Quick Select
                </label>
                <div className="mt-2 space-y-2">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceRangeClick(range)}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border text-left transition-all ${
                        filters.priceRange?.label === range.label
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-slate-50 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-600 hover:border-amber-400"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Tab */}
          {activeTab === "category" && (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label
                      key={cat}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => toggleArrayFilter("categories", cat)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-neutral-300">{cat}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No categories available</p>
              )}

              {materials.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-neutral-700">
                  <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Material
                  </label>
                  <div className="mt-2 space-y-2">
                    {materials.map(mat => (
                      <label
                        key={mat}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.materials.includes(mat)}
                          onChange={() => toggleArrayFilter("materials", mat)}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-600 dark:text-neutral-300">{mat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-neutral-700">
                  <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Size
                  </label>
                  <div className="mt-2 space-y-2">
                    {sizes.map(size => (
                      <label
                        key={size}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.sizes.includes(size)}
                          onChange={() => toggleArrayFilter("sizes", size)}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-600 dark:text-neutral-300">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Rating Tab */}
          {activeTab === "rating" && (
            <motion.div
              key="rating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Minimum Rating
                </label>
                <div className="mt-2 space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        filters.rating === rating
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-slate-50 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-600 hover:border-amber-400"
                      }`}
                    >
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < rating ? "text-amber-400" : "text-slate-300"}>★</span>
                        ))}
                      </div>
                      <span className="text-sm">& Up</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-700/50">
          <div className="flex flex-wrap gap-2">
            {filters.priceRange && (
              <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                {filters.priceRange.label}
              </span>
            )}
            {filters.categories.map(cat => (
              <span key={cat} className="px-2 py-1 text-xs bg-slate-200 dark:bg-neutral-600 text-slate-600 dark:text-neutral-300 rounded-full">
                {cat}
              </span>
            ))}
            {filters.rating > 0 && (
              <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                {filters.rating}★ & Up
              </span>
            )}
            {filters.inStock && (
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                In Stock
              </span>
            )}
            {filters.onSale && (
              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                On Sale
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

