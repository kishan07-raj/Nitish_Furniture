import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import ImageGallery from "./ImageGallery";
import DeliveryEstimator from "./DeliveryEstimator";
import CareWarranty from "./CareWarranty";
import ProductReviews from "./ProductReviews";
import RelatedProductsSlider from "./RelatedProductsSlider";

/* ---------------- PRICE CALCULATION ---------------- */
function calculatePrice(basePrice, wood = 1, size = 1, finish = 1) {
  if (!basePrice) return 0;
  return Math.round(basePrice * wood * size * finish);
}

const woodMultiplier = {
  Sheesham: 1.1,
  Teak: 1.3,
  Mango: 1.0,
};

const sizeMultiplier = {
  Queen: 1.0,
  King: 1.2,
  "4-seater": 1.0,
  "6-seater": 1.3,
};

const finishMultiplier = {
  Matte: 1.0,
  Glossy: 1.1,
};

export default function ProductDetail({ slug }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedWood, setSelectedWood] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFinish, setSelectedFinish] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);

        const axios = (await import("axios")).default;

        const { data: productRes } = await axios.get(`/products/${slug}`);
        const { data: allRes } = await axios.get(`/products`);

        const normalizedProduct = productRes?.product || productRes;
        const normalizedAll = allRes?.products || allRes || [];

        if (!cancelled) {
          setProduct(normalizedProduct);
          setAllProducts(normalizedAll);

          if (normalizedProduct?.woodOptions?.length) {
            setSelectedWood(normalizedProduct.woodOptions[0]);
          }
          if (normalizedProduct?.sizeOptions?.length) {
            setSelectedSize(normalizedProduct.sizeOptions[0]);
          }
          if (normalizedProduct?.finishOptions?.length) {
            setSelectedFinish(normalizedProduct.finishOptions[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        if (!cancelled) {
          setProduct(null);
          setAllProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) fetchData();
    window.scrollTo(0, 0);

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* ---------------- STICKY BAR VISIBILITY ---------------- */
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const triggerHeight = 400;
      setIsStickyVisible(scrollY > triggerHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const derived = useMemo(() => {
    const basePrice = product?.price || product?.basePrice || 0;

    const woodFactor = selectedWood
      ? woodMultiplier[selectedWood] || 1
      : 1;
    const sizeFactor = selectedSize
      ? sizeMultiplier[selectedSize] || 1
      : 1;
    const finishFactor = selectedFinish
      ? finishMultiplier[selectedFinish] || 1
      : 1;

    const finalPrice = calculatePrice(basePrice, woodFactor, sizeFactor, finishFactor);

    const productImages = product?.images || (product?.image ? [product.image] : []);

    const relatedProducts = Array.isArray(allProducts)
      ? allProducts.filter(
          (p) => p?._id !== product?._id && p?.category === product?.category
        )
      : [];

    return {
      finalPrice,
      productImages,
      relatedProducts,
    };
  }, [product, allProducts, selectedWood, selectedSize, selectedFinish]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      ...product,
      price: derived.finalPrice,
      selectedWood,
      selectedSize,
      selectedFinish,
      quantity: 1,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500 text-lg">
          Product not found.{" "}
          <button
            className="text-blue-600 underline"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-800">
          Home
        </Link>{" / "}
        <Link to="/stores" className="hover:text-gray-800">
          Products
        </Link>{" / "}
        <span className="text-gray-800 font-medium">{product.name}</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10">
        <div>
          <ImageGallery
            images={derived.productImages}
            selectedIndex={selectedImageIndex}
            onSelect={setSelectedImageIndex}
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-sm text-gray-500 mt-1">{product.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[#D4AF37] font-bold">{product.rating || 4.5}</span>
              <span className="text-[#D4AF37]">★</span>
              <span className="text-[#D4AF37]">★</span>
              <span className="text-[#D4AF37]">★</span>
              <span className="text-[#D4AF37]">★</span>
              <span className="text-gray-300">★</span>
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount || 128} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-gray-900">
              ₹{derived.finalPrice.toLocaleString("en-IN")}
            </span>
            {product.mrp && (
              <span className="text-sm line-through text-gray-400">
                ₹{product.mrp.toLocaleString("en-IN")}
              </span>
            )}
            {product.mrp && (
              <span className="text-sm text-green-600 font-medium">
                Save ₹{(product.mrp - derived.finalPrice).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#D4AF37]/10 to-[#E5C158]/10 border border-[#D4AF37]/20 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#D4AF37] font-semibold text-sm">Easy EMI Starting</span>
              <span className="text-gray-900 font-bold">₹{Math.round(derived.finalPrice / 6).toLocaleString("en-IN")}/month</span>
            </div>
            <p className="text-xs text-gray-600">No cost EMI available on select cards</p>
          </motion.div>

          {product.highlights?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Key Highlights</p>
              <ul className="space-y-1">
                {product.highlights.map((highlight, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="text-[#D4AF37]">✓</span>
                    {highlight}
                  </motion.li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">🛡️</span>
              <span>5 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">🚚</span>
              <span>Free Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">↩️</span>
              <span>Easy Returns</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">🔒</span>
              <span>Secure Payment</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-gray-700">Quantity</p>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button className="px-3 py-2 hover:bg-gray-100 transition-colors">−</button>
              <span className="px-4 py-2 font-medium">1</span>
              <button className="px-3 py-2 hover:bg-gray-100 transition-colors">+</button>
            </div>
            <span className="text-sm text-gray-500">{product.stockStatus || "In Stock"}</span>
          </div>

          <div className="space-y-4">
            {product.woodOptions?.length ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Wood</p>
                <div className="flex flex-wrap gap-2">
                  {product.woodOptions.map((wood) => (
                    <button
                      key={wood}
                      onClick={() => setSelectedWood(wood)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition ${
                        selectedWood === wood
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {wood}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.sizeOptions?.length ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition ${
                        selectedSize === size
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.finishOptions?.length ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Finish</p>
                <div className="flex flex-wrap gap-2">
                  {product.finishOptions.map((finish) => (
                    <button
                      key={finish}
                      onClick={() => setSelectedFinish(finish)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition ${
                        selectedFinish === finish
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <DeliveryEstimator pincode={product.defaultPincode} />
            <CareWarranty care={product.care} warranty={product.warranty} />
          </div>

          <div className="flex gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="flex-1 bg-gray-900 text-white py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition"
            >
              Add to Cart
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-900 py-3 rounded-md text-sm font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all"
            >
              Buy Now
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <ProductReviews productId={product._id} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <RelatedProductsSlider products={derived.relatedProducts} />
      </div>

      {isStickyVisible && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between z-40">
          <div>
            <p className="text-xs text-gray-500">Current selection</p>
            <p className="text-sm font-medium text-gray-900">₹{derived.finalPrice.toLocaleString("en-IN")}</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}

