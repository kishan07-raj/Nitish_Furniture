import { createContext, useContext, useState, useEffect } from "react";

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [compareItems, setCompareItems] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nf_compare");
      if (saved) {
        setCompareItems(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading compare items:", error);
    }
  }, []);

  // Save to localStorage whenever compareItems changes
  useEffect(() => {
    localStorage.setItem("nf_compare", JSON.stringify(compareItems));
  }, [compareItems]);

  const addToCompare = (product) => {
    if (compareItems.length >= 4) {
      alert("You can compare maximum 4 products at a time");
      return;
    }

    if (!compareItems.find(item => item._id === product._id)) {
      setCompareItems(prev => [...prev, product]);
    }
  };

  const removeFromCompare = (productId) => {
    setCompareItems(prev => prev.filter(item => item._id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (productId) => {
    return compareItems.some(item => item._id === productId);
  };

  const value = {
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return ctx;
}
