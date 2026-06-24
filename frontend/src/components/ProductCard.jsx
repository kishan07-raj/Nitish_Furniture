import { Link } from "react-router-dom";
import { calculatePrice } from "../utils/priceCalculator";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useWishlist } from "../context/WishlistContext";
import toast from "react-hot-toast";
import { toastMessages } from "../utils/toastMessages";
import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import ShimmerPlaceholder from "./ShimmerPlaceholder";

const woodMultiplier = { sheesham: 1.1, teak: 1.3, mango: 1.0 };
const sizeMultiplier = { single: 1.0, queen: 1.2, king: 1.4 };

function ProductCard({ product, showQuickView = true, showWishlist = true, showCompare = true }) {
  const { addToCart, isInCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { wishlistItems, isInWishlist, toggleWishlist } = useWishlist();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const productKey = product?._id || product?.id;
  const alreadyInCart = productKey ? isInCart(product) : false;
  const alreadyInWishlist = productKey ? isInWishlist(product) : false;

  const safeBasePrice = product?.basePrice || 0;
  const safeWood = product?.defaultWood?.toLowerCase() || "sheesham";
  const safeSize = product?.defaultSize?.toLowerCase() || "queen";

  const displayPrice = calculatePrice(
    safeBasePrice,
    woodMultiplier[safeWood] || 1,
    sizeMultiplier[safeSize] || 1
  );

  const handleAddToCart = (e) => {
    e.preventDefault();
    const key = product?._id || product?.id;
    if (!key) return;

    if (alreadyInCart) {
      toast((toastMessages.alreadyInCart(product?.name) || "Already in cart"), { icon: "🛒" });
      return;
    }

    addToCart(
      {
        _id: key,
        name: product.name,
        slug: product.slug,
        price: displayPrice,
        image: product.mainImage || "",
        defaultWood: product.defaultWood,
        defaultSize: product.defaultSize,
      },
      1
    );
    toast.success(toastMessages.addedToCart(product?.name), { icon: "🛒" });
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    const key = product?._id || product?.id;
    if (!key) return;

    if (alreadyInWishlist) {
      // Spec: prevent duplicate adds, but wishlist supports toggle.
      toggleWishlist(product);
      toast(toastMessages.removedFromWishlist(product?.name), { icon: "♡" });
      return;
    }

    toggleWishlist(product);
    toast.success(toastMessages.addedToWishlist(product?.name), { icon: "♡" });
  };

  const handleCompareToggle = (e) => {
    e.preventDefault();
    const key = product?._id || product?.id;
    if (!key) return;
    addToCompare(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    // TODO: Implement quick view modal
    console.log("Quick view for:", product?.name);
  };

  // Local fallback image
  const getFallbackImage = () => "/assets/no-image.png";

  const handleImageLoad = () => setImageLoaded(true);

  const { rating, reviewsCount } = product || {};
  const displayRating = typeof rating === "number" ? rating : 4.5;
  const displayReviewCount = typeof reviewsCount === "number" ? reviewsCount : 55;


  return (
    <ScrollReveal>
      <div
        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 overflow-hidden border border-neutral-100"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Premium Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {product?.isNew && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              New
            </span>
          )}
          {product?.isBestseller && (
            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
              <span className="text-xs">🔥</span>
              Bestseller
            </span>
          )}
          {product?.discount && (
            <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
              <span className="text-xs">%</span>
              {product.discount}% OFF
            </span>
          )}
        </div>

        {/* Action Buttons Overlay */}
        <div className={`absolute top-4 right-4 z-20 flex flex-col gap-2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
          {showWishlist && (
            <button
              onClick={handleWishlistToggle}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group/wishlist"
            >
              <span className={`text-lg transition-colors duration-300 ${alreadyInWishlist ? 'text-red-500' : 'text-neutral-600 group-hover/wishlist:text-red-500'}`}>
                {alreadyInWishlist ? '❤️' : '🤍'}
              </span>
            </button>
          )}
          {showCompare && (
            <button
              onClick={handleCompareToggle}
              className={`w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group/compare ${isInCompare(product?._id) ? 'bg-amber-100' : ''}`}
            >
              <span className={`text-lg transition-colors duration-300 ${isInCompare(product?._id) ? 'text-amber-600' : 'text-neutral-600 group-hover/compare:text-amber-600'}`}>
                ⚖️
              </span>
            </button>
          )}
          {showQuickView && (
            <button
              onClick={handleQuickView}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group/quickview"
            >
              <span className="text-lg text-neutral-600 group-hover/quickview:text-blue-600 transition-colors duration-300">
                👁️
              </span>
            </button>
          )}
        </div>

        {/* Product Image */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-50 relative">
          <img
            src={product?.images?.[0] || getFallbackImage()}
            alt={product?.name || "Product"}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={(e) => {
              e.target.src = getFallbackImage();
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Quick Action Overlay */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ${isHovered ? 'scale-100' : 'scale-95'}`}>
            <Link
              to={`/product/${product?.slug || ""}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-neutral-900 font-serif text-sm tracking-wide rounded-lg hover:bg-neutral-100 transition-all duration-300 transform hover:scale-105"
            >
              View Details
              <span className="ml-2 text-xs">→</span>
            </Link>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-6 space-y-3">
          {/* Category Tag */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium bg-neutral-100 px-2 py-1 rounded-full">
              {product?.category || "Furniture"}
            </span>
            <div className="flex items-center gap-1">
            <div className="flex text-amber-400 text-xs">
                {'★'.repeat(Math.floor(displayRating))}
                {displayRating % 1 !== 0 && '☆'}
              </div>
              <span className="text-xs text-neutral-600">({displayReviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-serif font-medium text-neutral-900 line-clamp-2 text-lg leading-tight group-hover:text-neutral-700 transition-colors duration-300">
            {product?.name || "Unnamed Product"}
          </h3>

          {/* Description */}
          <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
            {product?.shortDescription || product?.description || "Handcrafted with premium materials for timeless elegance."}
          </p>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-light text-amber-600">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            {product?.originalPrice && product.originalPrice > displayPrice && (
              <span className="text-sm text-neutral-500 line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product?.inStock !== false ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-xs font-medium ${product?.inStock !== false ? 'text-green-600' : 'text-red-600'}`}>
                {product?.inStock !== false ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            {product?.deliveryTime && (
              <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                🚚 {product.deliveryTime}
              </span>
            )}
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="px-6 pb-6">
          <button
            onClick={handleAddToCart}
            disabled={product?.inStock === false}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-serif text-sm tracking-wide py-3 rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-500 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>{product?.inStock !== false ? 'Add to Cart' : 'Out of Stock'}</span>
              {product?.inStock !== false && <span className="text-xs">🛒</span>}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </button>
        </div>

        {/* Premium Border Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/20 via-transparent to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </div>
    </ScrollReveal>
  );
}

export default ProductCard;
