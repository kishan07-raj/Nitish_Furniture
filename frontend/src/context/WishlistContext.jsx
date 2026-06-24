// frontend/src/context/WishlistContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

const API_BASE = "";

// Get key for product identification
function getKey(obj) {
  return obj._id || obj.id;
}

function getLocalWishlist() {
  try {
    const saved = localStorage.getItem("nf_wishlist");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user, isAuthenticated, token } = useAuth();
  const [wishlistItems, setWishlistItems] = useState(getLocalWishlist);
  const [loading, setLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem("nf_wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Sync with database when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWishlistFromDB();
    }
  }, [isAuthenticated, token]);

  const fetchWishlistFromDB = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      const data = await res.json();
      console.log("Wishlist API response:", data);
      
      // Handle both array response and { success, wishlist } response
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.success && Array.isArray(data.wishlist)) {
        items = data.wishlist;
      } else if (data.success && data.wishlist) {
        items = [data.wishlist];
      }
      
      setWishlistItems(items);
      localStorage.setItem("nf_wishlist", JSON.stringify(items));
    } catch (err) {
      console.error("Failed to fetch wishlist from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = useCallback(
    (product) => {
      const key = getKey(product);
      return wishlistItems.some((item) => getKey(item) === key);
    },
    [wishlistItems]
  );

  // Toggle wishlist item - add or remove
  const toggleWishlist = async (product) => {
    const key = getKey(product);
    const alreadyInWishlist = isInWishlist(product);

    // Optimistic UI update
    if (alreadyInWishlist) {
      setWishlistItems((prev) =>
        prev.filter((item) => getKey(item) !== key)
      );
    } else {
      setAddingProductId(key);
      setWishlistItems((prev) => [...prev, { ...product, _id: key }]);
    }

    // If user is logged in, sync with database
    if (isAuthenticated && token) {
      try {
        if (alreadyInWishlist) {
          await fetch(`${API_BASE}/api/wishlist/remove/${key}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await fetch(`${API_BASE}/api/wishlist/add`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId: key }),
          });
        }
      } catch (err) {
        console.error("Wishlist sync error:", err);
        // Revert on error
        if (alreadyInWishlist) {
          setWishlistItems((prev) => [...prev, { ...product, _id: key }]);
        } else {
          setWishlistItems((prev) =>
            prev.filter((item) => getKey(item) !== key)
          );
        }
      } finally {
        setAddingProductId(null);
      }
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    setWishlistItems((prev) =>
      prev.filter((item) => getKey(item) !== productId)
    );

    if (isAuthenticated && token) {
      try {
        await fetch(`${API_BASE}/api/wishlist/remove/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to remove from wishlist:", err);
      }
    }
  };

  // Clear wishlist
  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const wishlistCount = useMemo(
    () => wishlistItems.length,
    [wishlistItems]
  );

  const value = {
    wishlistItems,
    wishlistCount,
    loading,
    addingProductId,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}

export default WishlistContext;
