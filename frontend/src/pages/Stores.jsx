import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import ProductCard from "../components/ProductCard";

function Stores() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters / sort
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (searchQuery) {
          const searchRes = await axios.get(`/products/search?q=${encodeURIComponent(searchQuery)}`);
          setProducts(searchRes.data);
        } else {
          const res = await axios.get("/products");
          setProducts(res.data);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  // Filtered + sorted products
  let visibleProducts = [...products];

  // Category filter
  if (selectedCategory !== "all") {
    visibleProducts = visibleProducts.filter(
      (p) => p.category === selectedCategory
    );
  }

  // Price filter
  if (selectedPrice === "under-20000") {
    visibleProducts = visibleProducts.filter((p) => p.basePrice <= 20000);
  } else if (selectedPrice === "20-40000") {
    visibleProducts = visibleProducts.filter(
      (p) => p.basePrice > 20000 && p.basePrice <= 40000
    );
  } else if (selectedPrice === "above-40000") {
    visibleProducts = visibleProducts.filter((p) => p.basePrice > 40000);
  }

  // Sort
  if (sortBy === "price-low-high") {
    visibleProducts.sort((a, b) => a.basePrice - b.basePrice);
  } else if (sortBy === "price-high-low") {
    visibleProducts.sort((a, b) => b.basePrice - a.basePrice);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Our Stores</h1>
        <p className="mt-2 text-slate-600">
          Browse our complete collection of solid wood furniture – beds, dining sets, sofas, chairs, and more.
          All pieces are fully customizable in wood type, size, and finish.
        </p>
      </div>

      {/* Listing header */}
      <section className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Furniture Collection</h2>
        <p className="text-[11px] text-slate-500">
          Showing {visibleProducts.length} of {products.length} designs • fully
          customizable
        </p>
      </section>

      {/* Filters + sort */}
      <section className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Category</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-full border border-slate-300 bg-white px-2 py-1"
          >
            <option value="all">All Categories</option>
            <option value="bed">Beds</option>
            <option value="dining">Dining</option>
            <option value="sofa">Sofas</option>
            <option value="chair">Chairs</option>
            <option value="storage">Storage</option>
            <option value="decor">Decor</option>
          </select>
        </div>

        {/* Price filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Price</span>
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="rounded-full border border-slate-300 bg-white px-2 py-1"
          >
            <option value="all">All</option>
            <option value="under-20000">Under ₹20,000</option>
            <option value="20-40000">₹20,000 – ₹40,000</option>
            <option value="above-40000">Above ₹40,000</option>
          </select>
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-slate-500">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-slate-300 bg-white px-2 py-1"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Listing grid */}
      {loading ? (
        <p className="text-slate-600">Loading furniture collection...</p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </section>
      )}
    </div>
  );
}

export default Stores;
