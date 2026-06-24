// frontend/src/pages/Wishlist.jsx
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

function Wishlist() {
  const { wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();
  const { isInCart, addToCart: addToCartFromContext } = useCart();

  const handleAddToCart = (product) => {
    addToCartFromContext(product);
    removeFromWishlist(product._id);
  };

  if (wishlistCount === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💝</div>
          <h1 className="text-3xl font-semibold tracking-tight mb-4">My Wishlist</h1>
          <p className="text-slate-600 mb-6">Your saved products for later purchase.</p>
          <Link to="/stores" className="bg-amber-800 text-white px-6 py-3 rounded hover:bg-amber-900">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Wishlist</h1>
          <p className="text-sm text-slate-600 mt-1">{wishlistCount} saved item(s)</p>
        </div>
        <Link to="/stores" className="text-amber-700 hover:text-amber-800 font-medium">
          Continue Shopping
        </Link>
      </div>

      <div className="grid gap-4">
        {wishlistItems.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            {/* Product Image */}
            <Link to={`/product/${item.slug || item._id}`} className="flex-shrink-0">
              <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden">
                {item.images?.[0] || item.image ? (
                  <img
                    src={item.images?.[0] || item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🪑
                  </div>
                )}
              </div>
            </Link>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.slug || item._id}`}>
                <h3 className="font-medium text-slate-900 hover:text-amber-700 truncate">
                  {item.name}
                </h3>
              </Link>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {item.shortDescription || item.description || "Premium quality furniture"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-semibold text-amber-800">
                  ₹{item.basePrice?.toLocaleString() || item.price?.toLocaleString()}
                </span>
                {item.discount > 0 && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{((item.basePrice || item.price) * (1 + item.discount / 100)).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {isInCart(item) ? (
                <Link
                  to="/cart"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
                >
                  In Cart
                </Link>
              ) : (
                <button
                  onClick={() => handleAddToCart(item)}
                  className="px-4 py-2 text-sm bg-amber-800 text-white rounded-lg hover:bg-amber-900"
                >
                  Add to Cart
                </button>
              )}
              <button
                onClick={() => removeFromWishlist(item._id)}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
