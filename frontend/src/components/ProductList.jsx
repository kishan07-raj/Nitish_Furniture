import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import ShimmerPlaceholder from "./ShimmerPlaceholder";

/**
 * ProductList
 * - categorySlug maps to backend: GET /products/category/:slug
 * - Renders product cards with title, image, price, short description
 */
export default function ProductList({
  title,
  categorySlug,
  subtitle,
  emptyMessage,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const resolvedTitle = title || categorySlug || "Products";

  const resolvedSubtitle =
    subtitle ||
    `Discover our premium collection of ${String(resolvedTitle)
      .toLowerCase()
      .replace(/-/g, " ")}. crafted from solid wood.`;

  const resolvedEmptyMessage =
    emptyMessage ||
    `We're currently updating our ${String(resolvedTitle)
      .toLowerCase()
      .replace(/-/g, " ")} collection. Check back soon.`;

  const requestUrl = useMemo(() => {
    if (!categorySlug) return null;
    return `/products/category/${encodeURIComponent(categorySlug)}`;
  }, [categorySlug]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      if (!requestUrl) return;
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await axios.get(requestUrl);
        if (!cancelled) {
          setProducts(Array.isArray(res.data) ? res.data : res.data || []);
        }
      } catch (err) {
        console.error("Failed to load products", err);
        if (!cancelled) {
          setProducts([]);
          setErrorMsg("Failed to load products. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [requestUrl]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{resolvedTitle}</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {resolvedSubtitle}
        </p>
      </div>

      {/* Buying Guide / Filters hooks (future modular expansion) */}

      {errorMsg ? (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-slate-700 font-medium">{errorMsg}</p>
        </div>
      ) : loading ? (
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <ShimmerPlaceholder
              key={index}
              className="rounded-2xl bg-white p-6 shadow-sm"
            />
          ))}
        </section>
      ) : products.length > 0 ? (
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id || product.id || product.slug} product={product} />
          ))}
        </section>
      ) : (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🪑</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Products Found</h3>
            <p className="text-slate-600">{resolvedEmptyMessage}</p>
          </div>
        </div>
      )}

      {/* Bottom padding to avoid bumping fixed UI (mobile bottom nav) */}
      <div className="safe-area-pb" />
    </div>
  );
}

