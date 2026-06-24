import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Product360Viewer({ 
  images = [], 
  productName = "Product",
  autoRotate = true,
  rotationSpeed = 50
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  // If we have multiple images, use them for 360 view
  // Otherwise, create a simulated 360 effect with the same image
  const viewImages = images.length > 1 
    ? images 
    : [images[0], images[0], images[0], images[0], images[0], images[0], images[0], images[0]];

  // Auto rotation
  useEffect(() => {
    if (autoRotate && !isDragging) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % viewImages.length);
      }, rotationSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRotate, isDragging, viewImages.length, rotationSpeed]);

  // Handle mouse/touch drag for rotation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || e.touches?.[0]?.clientX || 0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    const diff = currentX - startX;
    
    if (Math.abs(diff) > 20) {
      const direction = diff > 0 ? -1 : 1;
      setCurrentIndex(prev => {
        let newIndex = prev + direction;
        if (newIndex < 0) newIndex = viewImages.length - 1;
        if (newIndex >= viewImages.length) newIndex = 0;
        return newIndex;
      });
      setStartX(currentX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex(prev => (prev - 1 + viewImages.length) % viewImages.length);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex(prev => (prev + 1) % viewImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewImages.length]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  if (viewImages.length === 0 || !viewImages[0]) {
    return (
      <div className="aspect-square bg-slate-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center">
        <div className="text-center text-slate-400 dark:text-neutral-500">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>360° view not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Viewer */}
      <div 
        ref={containerRef}
        className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Image */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="w-full h-full flex items-center justify-center p-8"
        >
          <img
            src={viewImages[currentIndex]}
            alt={`${productName} - View ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        </motion.div>

        {/* Drag Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
          <span className="text-white text-sm">Drag to rotate</span>
        </div>

        {/* Rotation Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full shadow">
          <div className="w-6 h-6 relative">
            <svg className="w-6 h-6 text-amber-600 animate-spin-slow" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 60" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            360° View
          </span>
        </div>

        {/* Loading Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-white/10 pointer-events-none" />
        )}
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {viewImages.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-amber-600 w-8"
                : "bg-slate-300 dark:bg-neutral-600 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none">
        <button
          onClick={() => setCurrentIndex(prev => (prev - 1 + viewImages.length) % viewImages.length)}
          className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentIndex(prev => (prev + 1) % viewImages.length)}
          className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center pointer-events-auto hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Instructions for mobile */}
      <div className="md:hidden text-center mt-2">
        <p className="text-xs text-slate-500">Swipe left or right to rotate</p>
      </div>
    </div>
  );
}

