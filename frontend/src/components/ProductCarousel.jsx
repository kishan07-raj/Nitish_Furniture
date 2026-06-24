import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";

function ProductCarousel({
  title = "Inspired by WoodenStreet",
  products = [],
  autoPlay = true,
  interval = 4000,
  showDots = true,
  showArrows = true,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);

  const totalSlides = products.length;
  const currentProduct = totalSlides ? products[currentIndex] : null;

  const goToSlide = useCallback(
    (index) => {
      if (!totalSlides) return;
      setCurrentIndex((index + totalSlides) % totalSlides);
    },
    [totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!autoPlay || isHovered || !totalSlides) return;

    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, interval);

    return () => clearInterval(id);
  }, [autoPlay, isHovered, interval, totalSlides]);

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const handleKey = (e) => {
      if (!totalSlides) return;
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextSlide, prevSlide, totalSlides]);

  // Touch swipe handlers (mobile)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const diff = e.touches[0].clientX - touchStartX.current;

    // threshold ~ 50px
    if (diff > 50) {
      prevSlide();
      touchStartX.current = null;
    } else if (diff < -50) {
      nextSlide();
      touchStartX.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  if (!totalSlides) return null;

  return (
    <section
      className="mt-8"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <span className="text-[11px] text-slate-500">
          Auto-scroll • Swipe / Arrow keys
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative mt-3 overflow-hidden rounded-xl bg-slate-900"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {products.map((p, index) => {
            const key = p._id || p.id || p.slug || index;
            const imageSrc =
              p.imageUrl ||
              p.images?.[0] ||
              p.image ||
              "https://via.placeholder.com/800x450/0f172a/ffffff?text=No+Image";

            return (
              <div
                key={key}
                className="w-full flex-shrink-0"
                aria-hidden={index !== currentIndex}
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={p.name}
                    loading={index === currentIndex ? "eager" : "lazy"}
                    className="h-full w-full object-cover transform transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                    <h3 className="text-lg sm:text-xl font-semibold line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-base sm:text-lg font-semibold text-amber-300">
                      ₹{(p.price || p.basePrice || 0).toLocaleString("en-IN")}
                    </p>
                    {p.subcategory && (
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-200/80">
                        {p.subcategory}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to={`/product/${p.slug}`}
                        className="rounded-full bg-amber-600 px-5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                      >
                        Buy Now
                      </Link>
                      <Link
                        to={`/product/${p.slug}`}
                        className="rounded-full border border-white/40 px-5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrows */}
        {showArrows && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 sm:p-2 text-white hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 sm:p-2 text-white hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Next slide"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {showDots && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-5 bg-amber-400"
                    : "w-2 bg-white/50 hover:bg-white"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        )}
      </div>

      {/* Optional meta below carousel */}
      {currentProduct && (
        <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span>
            {currentIndex + 1} / {totalSlides}
          </span>
          <span className="line-clamp-1">
            {currentProduct.name}
          </span>
        </div>
      )}
    </section>
  );
}

export default ProductCarousel;
