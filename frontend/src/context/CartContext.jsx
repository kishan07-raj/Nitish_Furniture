// frontend/src/context/CartContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const API_BASE = "";

// Get key for product identification
function getKey(obj) {
  return obj._id || obj.id;
}

function getStorageCart() {
  try {
    const saved = localStorage.getItem("nf_cart");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user, isAuthenticated, token } = useAuth();
  
  // Cart state
  const [cartItems, setCartItems] = useState(getStorageCart);
  const [loading, setLoading] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);
  const [syncingWithDB, setSyncingWithDB] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem("nf_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync cart with database when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      syncCartWithDB();
    }
  }, [isAuthenticated, token]);

  const syncCartWithDB = async () => {
    setSyncingWithDB(true);
    try {
      // First get cart from server
      const res = await fetch(`${API_BASE}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const serverCart = await res.json();
        
        if (serverCart && serverCart.items && serverCart.items.length > 0) {
          // Merge local cart with server cart (local cart takes precedence for recent changes)
          const localCart = getStorageCart();
          
          if (localCart.length > 0) {
            // Merge: combine quantities for same products
            const mergedCart = [...serverCart.items];
            
            localCart.forEach(localItem => {
              const existingIndex = mergedCart.findIndex(
                serverItem => getKey(serverItem) === getKey(localItem)
              );
              
              if (existingIndex >= 0) {
                // Update quantity (use higher of the two)
                mergedCart[existingIndex].qty = Math.max(
                  mergedCart[existingIndex].qty,
                  localItem.qty
                );
              } else {
                mergedCart.push(localItem);
              }
            });
            
            setCartItems(mergedCart);
          } else {
            // Just use server cart
            setCartItems(serverCart.items);
          }
          
          // Clear local cart after sync
          localStorage.removeItem("nf_cart");
        }
      }
    } catch (err) {
      console.error("Failed to sync cart with DB:", err);
    } finally {
      setSyncingWithDB(false);
    }
  };

  // Sync cart to database (for guest -> logged in transition)
  const syncCartToDB = useCallback(async () => {
    if (!isAuthenticated || !token || cartItems.length === 0) return;
    
    try {
      await fetch(`${API_BASE}/api/cart/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: cartItems }),
      });
    } catch (err) {
      console.error("Failed to sync cart to DB:", err);
    }
  }, [isAuthenticated, token, cartItems]);

  // Derived totals
  const itemsTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0),
    [cartItems]
  );

  const shippingCharge = itemsTotal > 0 ? 199 : 0;
  const tax = Math.round(itemsTotal * 0.18); // 18% GST - matches backend
  const grandTotal = itemsTotal + shippingCharge + tax;

  const itemsCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.qty || 1), 0),
    [cartItems]
  );

  // Check if product is in cart
  const isInCart = useCallback(
    (product) => {
      const key = getKey(product);
      return cartItems.some((item) => getKey(item) === key);
    },
    [cartItems]
  );

  // Add to cart with duplicate prevention
  const addToCart = useCallback(async (product, qty = 1) => {
    const key = getKey(product);
    if (!key) return;

    // Optimistic UI update
    setCartItems((prev) => {
      const existing = prev.find((p) => getKey(p) === key);
      if (existing) {
        return prev.map((p) =>
          getKey(p) === key ? { ...p, qty: (p.qty || 1) + qty } : p
        );
      }
      return [...prev, { ...product, _id: key, qty }];
    });

    // Show loading state
    setAddingProductId(key);
    
    // Sync with database if logged in
    if (isAuthenticated && token) {
      try {
        await fetch(`${API_BASE}/api/cart/add`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            productId: key, 
            qty,
            price: product.price,
            name: product.name,
            image: product.images?.[0] || product.image
          }),
        });
      } catch (err) {
        console.error("Failed to add to cart in DB:", err);
      } finally {
        setAddingProductId(null);
      }
    } else {
      setAddingProductId(null);
    }
  }, [isAuthenticated, token]);

  // Update quantity
  const updateQty = useCallback(async (productId, qty) => {
    const newQty = Math.max(1, qty);
    
    setCartItems((prev) =>
      prev.map((p) =>
        getKey(p) === productId ? { ...p, qty: newQty } : p
      )
    );

    // Sync with database
    if (isAuthenticated && token) {
      try {
        await fetch(`${API_BASE}/api/cart/update`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId, qty: newQty }),
        });
      } catch (err) {
        console.error("Failed to update qty in DB:", err);
      }
    }
  }, [isAuthenticated, token]);

  // Remove from cart
  const removeFromCart = useCallback(async (productId) => {
    setCartItems((prev) => prev.filter((p) => getKey(p) !== productId));

    if (isAuthenticated && token) {
      try {
        await fetch(`${API_BASE}/api/cart/remove/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to remove from cart in DB:", err);
      }
    }
  }, [isAuthenticated, token]);

  // Clear cart
  const clearCart = useCallback(async () => {
    setCartItems([]);
    
    if (isAuthenticated && token) {
      try {
        await fetch(`${API_BASE}/api/cart/clear`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to clear cart in DB:", err);
      }
    }
  }, [isAuthenticated, token]);

  const value = {
    cartItems,
    itemsTotal,
    shippingCharge,
    tax,
    grandTotal,
    itemsCount,
    loading,
    addingProductId,
    isInCart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

export default CartContext;
