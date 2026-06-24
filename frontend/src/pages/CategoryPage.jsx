import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

// Category mapping for mega menu items to product categories
const categoryMapping = {
  "Sofas": "living",
  "Living": "living",
  "Bedroom": "bed",
  "Mattress": "bed",
  "Dining": "dining",
  "Storage": "storage",
  "Decor & Furnishing": "decor",
  "Modular Kitchen & Wardrobe": "modular",
  "Kids & Furniture": "kids",
  "Commercial & Office Furniture": "office",
  "Study & Office": "office"
};

function CategoryPage() {
  const { category, subcategory } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Search for products that match the subcategory
        const searchRes = await axios.get(`/products/search?q=${encodeURIComponent(subcategory.replace(/-/g, ' '))}`);
        setProducts(searchRes.data);
      } catch (err) {
        console.error("Failed to load products", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [subcategory]);

  // Local fallback image
  const getFallbackImage = () => "/assets/no-image.png";

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{subcategory.replace(/-/g, ' ')}</h1>
        <p className="text-slate-600 mt-2">
          Discover our collection of {subcategory.replace(/-/g, ' ').toLowerCase()} furniture
        </p>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500">No products found in this category.</p>
          <p className="text-sm text-slate-400 mt-2">
            Try exploring other categories or check back later.
          </p>
        </div>
      )}
    </div>
  );
}

export default CategoryPage;
