import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

/**
 * Voice Commerce Component
 * Allows users to search products using voice commands
 * Supports natural language queries like:
 * - "Show modern sofa under 15000"
 * - "Find king size wooden bed"
 * - "Bedroom furniture under 50000"
 */

export default function VoiceCommerce({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState("voice"); // 'voice' or 'text'
  const [textQuery, setTextQuery] = useState("");
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-IN';

        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex;
          const transcript_text = event.results[current][0].transcript;
          setTranscript(transcript_text);
          
          if (event.results[current].isFinal) {
            processVoiceQuery(transcript_text);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setError("Voice recognition error. Please try again.");
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Text search when mode is text
  useEffect(() => {
    if (searchMode === "text" && textQuery.length >= 3) {
      const debounceTimer = setTimeout(() => {
        processVoiceQuery(textQuery);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [textQuery, searchMode]);

  const startListening = () => {
    setError(null);
    setResults([]);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        speak("I'm listening. Tell me what you're looking for.");
      } catch (err) {
        console.error("Error starting recognition:", err);
        setError("Could not start voice recognition. Please type your search.");
        setSearchMode("text");
      }
    } else {
      setError("Voice recognition not supported. Please type your search.");
      setSearchMode("text");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      synthRef.current.speak(utterance);
    }
  };

  const processVoiceQuery = async (query) => {
    setLoading(true);
    setTranscript(query);
    
    try {
      // Send to backend AI processing
      const response = await fetch(`/api/products/voice-search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success && data.products && data.products.length > 0) {
        setResults(data.products);
        speak(`I found ${data.products.length} products for ${query}. Showing results now.`);
      } else {
        setResults([]);
        speak("I couldn't find any products matching your request. Try a different search.");
      }
    } catch (err) {
      console.error("Voice search error:", err);
      // Fallback to regular search
      try {
        const fallbackRes = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData && fallbackData.length > 0) {
          setResults(fallbackData);
        } else {
          setResults([]);
        }
      } catch (fallbackErr) {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.slug}`);
    onClose?.();
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product);
    speak(`Added ${product.name} to cart`);
  };

  const handleViewAllResults = () => {
    if (transcript) {
      navigate(`/stores?search=${encodeURIComponent(transcript)}`);
      onClose?.();
    }
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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] p-6 text-center">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Voice Shopping</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-neutral-800 mt-1">Try: "modern sofa under 15000"</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setSearchMode("voice")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                searchMode === "voice" 
                  ? "text-[#D4AF37] border-b-2 border-[#D4AF37]" 
                  : "text-neutral-500"
              }`}
            >
              🎤 Voice
            </button>
            <button
              onClick={() => setSearchMode("text")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                searchMode === "text" 
                  ? "text-[#D4AF37] border-b-2 border-[#D4AF37]" 
                  : "text-neutral-500"
              }`}
            >
              ⌨️ Type
            </button>
          </div>

          {/* Search Area */}
          <div className="p-6">
            {searchMode === "voice" ? (
              <div className="text-center">
                {/* Microphone Button */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening
                      ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                      : "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:shadow-lg hover:shadow-[#D4AF37]/30"
                  }`}
                >
                  <svg className={`w-10 h-10 ${isListening ? 'text-white' : 'text-neutral-900'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </button>
                
                <p className="mt-4 text-sm text-neutral-500">
                  {isListening ? "Listening..." : "Tap to speak"}
                </p>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Type your search query..."
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-[#D4AF37] focus:outline-none bg-transparent dark:bg-neutral-800"
                  autoFocus
                />
                <button
                  onClick={() => textQuery && processVoiceQuery(textQuery)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#D4AF37] rounded-lg"
                >
                  <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Transcript Display */}
            {(transcript || loading) && (
              <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Searching for "{transcript || textQuery}"...
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium text-[#D4AF37]">You said:</span> "{transcript || textQuery}"
                  </p>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Found {results.length} products
                  </p>
                  <button
                    onClick={handleViewAllResults}
                    className="text-sm text-[#D4AF37] hover:underline"
                  >
                    View all →
                  </button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.slice(0, 5).map((product) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl cursor-pointer hover:bg-[#D4AF37]/10 transition-colors"
                      onClick={() => handleProductClick(product)}
                    >
                      <img
                        src={product.images?.[0] || "/assets/no-image.png"}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {product.name}
                        </h4>
                      <p className="text-sm font-bold text-[#D4AF37]">
                          ₹{product.basePrice?.toLocaleString("en-IN") || product.price?.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-[#D4AF37] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && transcript && results.length === 0 && (
              <div className="mt-4 text-center p-6">
                <p className="text-neutral-500">No products found for "{transcript}"</p>
                <button
                  onClick={handleViewAllResults}
                  className="mt-2 text-sm text-[#D4AF37] hover:underline"
                >
                  Try a broader search →
                </button>
              </div>
            )}

            {/* Quick Suggestions */}
            {!transcript && !loading && results.length === 0 && (
              <div className="mt-6">
                <p className="text-xs text-neutral-500 mb-3">Try saying:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Modern sofa under 20000",
                    "King size bed",
                    "Dining table for 6",
                    "Office desk"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setTextQuery(suggestion);
                        processVoiceQuery(suggestion);
                      }}
                      className="px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full hover:bg-[#D4AF37]/20 transition-colors"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Voice Search Button - Mini component for navbar
 */
export function VoiceSearchButton({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-900 hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all ${className}`}
        title="Voice Search"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>
      <VoiceCommerce isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

