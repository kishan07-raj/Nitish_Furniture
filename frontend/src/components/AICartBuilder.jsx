import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

/**
 * AI Smart Cart Builder
 * Users can type prompts like "Complete bedroom setup under 50000"
 * AI automatically builds a cart with essential room items
 */

export default function AICartBuilder({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
  
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [addedItems, setAddedItems] = useState([]);
  
  const roomTypes = [
    { id: "bedroom", name: "Bedroom", icon: "🛏️" },
    { id: "living", name: "Living Room", icon: "🛋️" },
    { id: "dining", name: "Dining", icon: "🍽️" },
    { id: "office", name: "Office", icon: "💼" }
  ];
  
  const budgetRanges = [
    { id: 20000, label: "Under ₹20,000" },
    { id: 30000, label: "Under ₹30,000" },
    { id: 50000, label: "Under ₹50,000" },
    { id: 75000, label: "Under ₹75,000" },
    { id: 100000, label: "Under ₹1,00,000" }
  ];
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(50000);
  
  const handleQuickSetup = (room, budget) => {
    setSelectedRoom(room);
    setSelectedBudget(budget);
    buildSmartCart(room, budget);
  };
  
  const buildSmartCart = async (room = selectedRoom, budget = selectedBudget) => {
    if (!room && !prompt) {
      setError("Please select a room type or enter a prompt");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Parse prompt if provided
      let roomParam = room;
      let budgetParam = budget;
      
      if (prompt) {
        // Extract room and budget from prompt
        const roomMatch = prompt.match(/(bedroom|living|dining|office)/i);
        const budgetMatch = prompt.match(/under\s*₹?(\d+)/i) || prompt.match(/(\d+)\s*under/i);
        
        if (roomMatch) roomParam = roomMatch[1].toLowerCase();
        if (budgetMatch) budgetParam = parseInt(budgetMatch[1].replace(/,/g, ''));
      }
      
      const response = await fetch(
        `/api/voice/smart-cart?room=${encodeURIComponent(roomParam)}&budget=${budgetParam}`
      );
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        setSelectedRoom(data.room);
      } else {
        setError(data.message || "Failed to build cart");
      }
    } catch (err) {
      console.error("Smart cart error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToCart = (item) => {
    const product = item.product;
    addToCart({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.basePrice,
      basePrice: product.basePrice,
      imageUrl: product.images?.[0],
      quantity: 1
    });
    setAddedItems([...addedItems, item.product._id]);
  };
  
  const handleAddAllToCart = () => {
    if (!results?.items) return;
    
    clearCart();
    
    results.items.forEach(item => {
      const product = item.product;
      addToCart({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.basePrice,
        basePrice: product.basePrice,
        imageUrl: product.images?.[0],
        quantity: 1
      });
    });
    
    setAddedItems(results.items.map(i => i.product._id));
  };
  
  const handleViewProduct = (slug) => {
    navigate(`/product/${slug}`);
    onClose?.();
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">AI Cart Builder</h2>
                <p className="text-sm text-neutral-800 mt-1">
                  Tell us your room & budget, we'll build your cart!
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Quick Setup Buttons */}
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
                Quick Setup
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {roomTypes.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleQuickSetup(room.id, selectedBudget)}
                    disabled={loading}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedRoom === room.id
                        ? "border-[#D4AF37] bg-[#D4AF37]/10"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-[#D4AF37]/50"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{room.icon}</span>
                    <span className="text-xs font-medium">{room.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Budget Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
                Your Budget
              </p>
              <div className="flex flex-wrap gap-2">
                {budgetRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => {
                      setSelectedBudget(range.id);
                      if (selectedRoom) handleQuickSetup(selectedRoom, range.id);
                    }}
                    disabled={loading}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedBudget === range.id
                        ? "bg-[#D4AF37] text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-[#D4AF37]/20"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Custom Prompt Input */}
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">
                Or type a custom prompt
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g., "Complete bedroom setup under 50000"'
                  className="flex-1 px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-[#D4AF37] focus:outline-none bg-transparent dark:bg-neutral-800"
                  onKeyDown={(e) => e.key === "Enter" && buildSmartCart()}
                />
                <button
                  onClick={() => buildSmartCart()}
                  disabled={loading || !prompt}
                  className="px-6 py-3 bg-[#D4AF37] text-neutral-900 font-semibold rounded-xl hover:bg-[#E5C158] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Building..." : "Build"}
                </button>
              </div>
            </div>
            
            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-neutral-500">AI is building your perfect setup...</p>
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            {/* Results */}
            {results && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white capitalize">
                        {results.room} Setup
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {results.itemCount} essential items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-500">Total</p>
                      <p className="text-xl font-bold text-[#D4AF37]">
                        ₹{results.totalPrice?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  
                  {results.savings > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <span>🎉</span>
                      <span>You save ₹{results.savings.toLocaleString("en-IN")} with this bundle!</span>
                    </div>
                  )}
                </div>
                
                {/* Items List */}
                <div className="space-y-3 mb-4">
                  {results.items?.map((item, index) => (
                    <motion.div
                      key={item.product._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white dark:bg-neutral-700 flex-shrink-0">
                        <img
                          src={item.product.images?.[0] || "/assets/no-image.png"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-neutral-500 capitalize">{item.itemType}</p>
                        <p className="text-sm font-bold text-[#D4AF37]">
                          ₹{item.product.basePrice?.toLocaleString("en-IN")}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleViewProduct(item.product.slug)}
                          className="px-3 py-1.5 text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-[#D4AF37]/20 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={addedItems.includes(item.product._id)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            addedItems.includes(item.product._id)
                              ? "bg-green-500 text-white"
                              : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-[#D4AF37]"
                          }`}
                        >
                          {addedItems.includes(item.product._id) ? "Added" : "Add"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Add All Button */}
                {addedItems.length !== results.items?.length && (
                  <button
                    onClick={handleAddAllToCart}
                    className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🛒</span>
                    <span>Add All {results.itemCount} Items to Cart</span>
                    <span className="font-bold">₹{results.totalPrice?.toLocaleString("en-IN")}</span>
                  </button>
                )}
                
                {addedItems.length === results.items?.length && (
                  <Link
                    to="/cart"
                    onClick={onClose}
                    className="w-full block py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors text-center"
                  >
                    ✓ All Items Added - View Cart
                  </Link>
                )}
              </motion.div>
            )}
            
            {/* Empty State */}
            {!results && !loading && !error && (
              <div className="text-center py-8 text-neutral-500">
                <div className="text-4xl mb-4">🏠</div>
                <p>Select a room or enter a prompt to get started</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Smart Cart Button - Mini component for navbar
 */
export function SmartCartButton({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-900 font-medium text-sm hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all ${className}`}
        title="AI Smart Cart"
      >
        <span>🤖</span>
        <span>AI Cart</span>
      </button>
      <AICartBuilder isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

