import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import BuyingGuide from "../components/BuyingGuide";
import VisualFilters from "../components/VisualFilters";
import ShimmerPlaceholder from "../components/ShimmerPlaceholder";

function CategoryProducts() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/products/category/${slug}`);
        setProducts(res.data);
        // Set category name based on slug
        const categoryNames = {
          bedroom: "Bedroom",
          sofas: "Sofas",
          living: "Living",
          mattress: "Mattress",
          dining: "Dining",
          storage: "Storage",
          office: "Study & Office",
          decor: "Decor & Furnishing",
          modular: "Modular Kitchen & Wardrobe",
          kids: "Kids & Furniture"
        };
        setCategoryName(categoryNames[slug] || slug.replace("-", " ").toUpperCase());
      } catch (err) {
        console.error("Failed to load category products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{categoryName}</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Discover our premium collection of {categoryName.toLowerCase()} crafted from the finest solid wood,
          designed to bring elegance and durability to your home.
        </p>
      </div>

      {/* Buying Guide */}
      <div className="mb-8">
        <BuyingGuide category={slug} />
      </div>

      {/* Filters */}
      <div className="mb-12">
        <VisualFilters />
      </div>

      {/* Products Grid */}
      {loading ? (
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <ShimmerPlaceholder key={index} className="rounded-2xl bg-white p-6 shadow-sm" />
          ))}
        </section>
      ) : products.length > 0 ? (
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </section>
      ) : (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🪑</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Products Found</h3>
            <p className="text-slate-600">
              We're currently updating our {categoryName.toLowerCase()} collection.
              Check back soon for new arrivals!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryProducts;
