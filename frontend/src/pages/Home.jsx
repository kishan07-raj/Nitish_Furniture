import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, useInView, AnimatePresence } from "framer-motion";
import ProductCard from "../components/ProductCard";

import ScrollReveal from "../components/ScrollReveal";
import AnimatedCounter from "../components/AnimatedCounter";
import FloatingParticles from "../components/FloatingParticles";
import ParallaxSection from "../components/ParallaxSection";
import { testimonials } from "../data/testimonials";

// Animation variants for Framer Motion
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

// Animated underline component
function AnimatedUnderline({ delay = 0 }) {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: "100%" }}
      transition={{ duration: 1.2, delay: delay, ease: "easeInOut" }}
      className="h-[2px] bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] rounded-full"
      style={{
        boxShadow: "0 0 10px rgba(212, 175, 55, 0.5), 0 0 20px rgba(212, 175, 55, 0.3)"
      }}
    />
  );
}

// Premium Button Component
function PremiumButton({ children, primary = false, className = "", ...props }) {
  const baseClasses = primary 
    ? "bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-900 font-semibold shadow-lg"
    : "bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/60";
  
  return (
    <motion.button
      whileHover={{ 
        scale: 1.02, 
        y: -3,
        boxShadow: primary ? "0 10px 40px rgba(212, 175, 55, 0.4)" : "0 10px 30px rgba(255, 255, 255, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden px-8 py-4 text-lg tracking-wide rounded-xl transition-all duration-500 ${baseClasses} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      {primary && (
        <motion.div
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}
    </motion.button>
  );
}

// Trust Strip Component
function TrustStrip() {
  const trustItems = [
    { icon: "🚚", title: "Free Delivery", subtitle: "Across all major cities" },
    { icon: "🛡️", title: "5 Year Warranty", subtitle: "On all furniture" },
    { icon: "🌳", title: "100% Solid Wood", subtitle: "Premium quality" },
    { icon: "↩️", title: "Easy Returns", subtitle: "30-day policy" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="py-8 bg-neutral-900 border-y border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-2xl shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                <p className="text-neutral-400 text-xs">{item.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// Premium Product Carousel Component
function PremiumProductCarousel({ products }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const featuredProducts = [
    {
      id: 1,
      name: "Grand Velvet Sofa",
      category: "Living Room",
      price: "₹89,999",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=800&fit=crop",
      tag: "Best Seller"
    },
    {
      id: 2,
      name: "Oak Dining Set",
      category: "Dining Room",
      price: "₹1,29,999",
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&h=800&fit=crop",
      tag: "Premium"
    },
    {
      id: 3,
      name: "King Size Platform Bed",
      category: "Bedroom",
      price: "₹74,999",
      image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200&h=800&fit=crop",
      tag: "New"
    },
    {
      id: 4,
      name: "Executive Office Desk",
      category: "Office",
      price: "₹54,999",
      image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200&h=800&fit=crop",
      tag: "Popular"
    },
  ];

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
      }, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  return (
    <section 
      className="py-20 bg-neutral-900 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-[#D4AF37] text-sm font-serif tracking-[0.3em] uppercase mb-4">
            Curated Collection
          </span>
          <h2 className="text-4xl lg:text-5xl font-serif font-light text-white">
            Featured <span className="text-[#D4AF37]">Masterpieces</span>
          </h2>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="grid lg:grid-cols-2 gap-8 items-center"
            >
              {/* Product Image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src={featuredProducts[currentIndex].image}
                  alt={featuredProducts[currentIndex].name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent" />
                
                {/* Tag */}
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-4 left-4 px-4 py-1.5 bg-[#D4AF37] text-neutral-900 text-xs font-semibold rounded-full"
                >
                  {featuredProducts[currentIndex].tag}
                </motion.span>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <p className="text-[#D4AF37] text-sm tracking-widest uppercase mb-2">
                    {featuredProducts[currentIndex].category}
                  </p>
                  <h3 className="text-3xl lg:text-4xl font-serif text-white mb-4">
                    {featuredProducts[currentIndex].name}
                  </h3>
                  <p className="text-2xl font-semibold text-[#D4AF37]">
                    {featuredProducts[currentIndex].price}
                  </p>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Experience the pinnacle of craftsmanship. Each piece is meticulously crafted 
                  using premium materials and traditional woodworking techniques passed down 
                  through generations.
                </p>
                <Link
                  to="/category/featured"
                  className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-white transition-colors duration-300"
                >
                  Explore Collection
                  <span>→</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={goToPrev}
              className="w-12 h-12 rounded-full border border-white/20 text-white hover:bg-[#D4AF37] hover:text-neutral-900 hover:border-[#D4AF37] transition-all duration-300 flex items-center justify-center"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              {featuredProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 bg-[#D4AF37]" 
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={goToNext}
              className="w-12 h-12 rounded-full border border-white/20 text-white hover:bg-[#D4AF37] hover:text-neutral-900 hover:border-[#D4AF37] transition-all duration-300 flex items-center justify-center"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Social Proof Badge Component
function SocialProofBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-6 bg-neutral-50 border-y border-neutral-200"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          {/* Stats */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-serif text-[#D4AF37] font-bold">25,000+</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">Happy Homes</div>
            </div>
            <div className="w-px h-12 bg-neutral-300" />
            <div className="text-center">
              <div className="text-2xl font-serif text-[#D4AF37] font-bold">15+</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">Years Experience</div>
            </div>
            <div className="w-px h-12 bg-neutral-300" />
            <div className="text-center">
              <div className="text-2xl font-serif text-[#D4AF37] font-bold">4.9</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider">Rating</div>
            </div>
          </div>
          
          {/* Badge Text */}
          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-neutral-100">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-medium text-neutral-700">
              "Trusted by 25,000+ happy homes across India"
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("/products");
        // Ensure products is always an array, even if API returns error object
        const data = Array.isArray(res.data) ? res.data : [];
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products", err);
        setProducts([]); // Ensure products is an array on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Best sellers products (top 8) - safely handle non-array
  const bestSellerProducts = Array.isArray(products) 
    ? products.slice(0, 8).map((p) => ({
        _id: p._id,
        slug: p.slug,
        name: p.name,
        price: p.basePrice,
        originalPrice: p.basePrice + Math.floor(p.basePrice * 0.2),
        imageUrl: p.images?.[0] || "",
        discount: Math.floor(Math.random() * 20) + 10,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 50) + 10,
      }))
    : [];

  // Featured categories
  const categories = [
    {
      name: "Sofas",
      slug: "sofas",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop&crop=center",
      description: "Comfortable seating for your living space",
      count: 120
    },
    {
      name: "Living Room",
      slug: "living",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&crop=center",
      description: "Sofas, tables & seating solutions",
      count: 85
    },
    {
      name: "Bedroom",
      slug: "bedroom",
      image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&h=600&fit=crop&crop=center",
      description: "Beds, wardrobes & bedroom essentials",
      count: 95
    },
    {
      name: "Mattresses",
      slug: "mattress",
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=600&fit=crop&crop=center",
      description: "Quality mattresses for better sleep",
      count: 45
    },
    {
      name: "Dining",
      slug: "dining",
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=600&fit=crop&crop=center",
      description: "Dining sets, tables & chairs",
      count: 68
    },
    {
      name: "Storage",
      slug: "storage",
      image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600&h=600&fit=crop&crop=center",
      description: "Cabinets, organizers & storage solutions",
      count: 72
    },
    {
      name: "Office",
      slug: "office",
      image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=600&fit=crop&crop=center",
      description: "Desks, chairs & office furniture",
      count: 58
    },
    {
      name: "Kids",
      slug: "kids",
      image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=600&fit=crop&crop=center",
      description: "Children's furniture & play areas",
      count: 42
    },
  ];

  // Trust/Why Choose Us features
  const trustFeatures = [
    {
      icon: "🚚",
      title: "Free Delivery",
      description: "Across all major cities"
    },
    {
      icon: "✨",
      title: "Premium Quality",
      description: "Handcrafted with precision"
    },
    {
      icon: "↩️",
      title: "Easy Returns",
      description: "30-day return policy"
    },
    {
      icon: "🔒",
      title: "Secure Payment",
      description: "100% secure transactions"
    }
  ];

  // Promo banner data
  const promoBanner = {
    title: "Flat 25% Off",
    subtitle: "On All Bedroom Furniture",
    description: "Transform your bedroom into a sanctuary of comfort and style",
    cta: "Shop Now",
    image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1920&h=600&fit=crop&crop=center"
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* SECTION 1: HERO + DESKTOP PREMIUM BANNERS */}
      <section className="relative min-h-screen md:min-h-[92vh] lg:min-h-[88vh] flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#1a1a1a]">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 z-0">
          <FloatingParticles />
        </div>

        {/* Overall Vignette for Cinematic Depth */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.3)_100%)]"></div>

        <div className="relative z-10 py-6 md:py-8 h-full w-full">
          <div className="h-full w-full flex flex-col gap-6 md:gap-8">
            {/* FULL-WIDTH TOP HERO */}
            <div className="relative group overflow-hidden min-h-[560px] sm:min-h-[620px] lg:min-h-[660px] rounded-none shadow-none w-full">
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.25)_100%)]" />
              <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,248,230,0.08)_0%,_transparent_50%)]" />

              <img
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=2000&h=1200&fit=crop"
                alt="Luxury living room interior with solid wood sofa"
                loading="eager"
                className="absolute inset-0 w-full h-full object-cover object-center brightness-95 contrast-110 saturate-90 transition-transform duration-700 group-hover:scale-[1.03]"
              />

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-3xl"
                >
                  <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#C9A227] via-[#D4AF37] to-[#C9A227] text-neutral-900 text-xs font-bold uppercase tracking-wider rounded-full mb-4 md:mb-6 shadow-lg">
                    Premium Collection
                  </span>

                  <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-semibold text-white leading-tight tracking-wide">
                    Living Room
                    <span className="block bg-gradient-to-r from-[#E8D9A0] via-[#D4AF37] to-[#A88B2D] bg-clip-text text-transparent">Elegance</span>
                  </h2>

                  <p className="text-neutral-200 text-sm md:text-base lg:text-lg max-w-2xl mt-3 md:mt-4 mb-5 md:mb-7 leading-relaxed line-clamp-2 font-semibold">
                    Premium comfort crafted in solid wood.
                  </p>

                  <Link to="/living-room">
                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-neutral-900 hover:bg-[#2b1b0e] text-white px-8 md:px-10 lg:px-12 py-4 md:py-5 rounded-xl font-semibold tracking-wide shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 hover:-translate-y-1 text-lg border border-white/10"
                    >
                      Explore Living Room
                      <span className="text-lg">→</span>
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* DESKTOP: two cards side-by-side; MOBILE/TABLET: stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Premium Storage Beds */}
              <div className="relative group min-h-[280px] md:min-h-[320px] overflow-hidden rounded-3xl shadow-2xl">
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.2)_100%)]" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,248,230,0.06)_0%,_transparent_40%)]" />

                <img
                  src="https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200&h=800&fit=crop"
                  alt="Premium wooden storage bed modern bedroom"
                  loading="lazy"
                  className="w-full h-full object-center object-cover brightness-95 contrast-110 saturate-90 transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                  >
                    <span className="inline-block px-3 py-1.5 bg-white/15 backdrop-blur-md text-white text-xs font-medium uppercase tracking-wider rounded-full mb-4 border border-white/10">
                      Premium Storage
                    </span>

                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif font-semibold text-white mb-2 leading-tight tracking-wide">
                      Premium Storage Beds
                    </h3>

                    <p className="text-neutral-200 text-sm md:text-base leading-relaxed line-clamp-2">
                      Smart space with a luxury finish.
                    </p>

                    <Link to="/storage-beds" className="inline-flex">
                      <span className="mt-6 inline-flex items-center justify-center bg-[#2b1b0e] hover:bg-[#1a120b] text-white px-9 py-4 rounded-xl font-semibold text-lg shadow-2xl border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#A86A2C]/25">
                        Shop Storage
                        <span className="ml-2">→</span>
                      </span>
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* Luxury Recliners */}
              <div className="relative group min-h-[280px] md:min-h-[320px] overflow-hidden rounded-3xl shadow-2xl">
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.2)_100%)]" />
                <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,248,230,0.06)_0%,_transparent_40%)]" />

                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=800&fit=crop"
                  alt="Luxury recliner chair comfort scene"
                  loading="lazy"
                  className="w-full h-full object-center object-cover md:object-[center_40%] brightness-95 contrast-110 saturate-90 transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <span className="inline-block px-3 py-1.5 bg-white/15 backdrop-blur-md text-white text-xs font-medium uppercase tracking-wider rounded-full mb-4 border border-white/10">
                      Luxury Recliners
                    </span>

                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif font-semibold text-white mb-2 leading-tight tracking-wide">
                      Luxury Recliners
                    </h3>

                    <p className="text-neutral-200 text-sm md:text-base leading-relaxed line-clamp-2">
                      Premium relaxation with a refined finish.
                    </p>

                    <Link to="/recliners" className="inline-flex">
                      <span className="mt-6 inline-flex items-center justify-center bg-[#2b1b0e] hover:bg-[#1a120b] text-white px-9 py-4 rounded-xl font-semibold shadow-2xl transition-all duration-300 text-lg border border-white/10 hover:scale-[1.02] hover:shadow-[#A86A2C]/25">
                        View Recliners
                        <span className="ml-2">→</span>
                      </span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom separation */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-900/10 to-transparent z-20 pointer-events-none" />

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs font-sans tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent"
            />
          </div>
        </motion.div>
      </section>


      {/* Trust Strip */}
      <TrustStrip />

      {/* Social Proof Badge */}
      <SocialProofBadge />

      {/* Premium Product Carousel */}
      <PremiumProductCarousel products={products} />

      {/* SECTION: FEATURED CATEGORIES - 4/2/1 Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-neutral-500 text-sm font-serif tracking-widest uppercase border-b border-neutral-300 pb-2 mb-4">
              Shop by Category
            </span>
            <h2 className="text-4xl lg:text-5xl font-serif font-light text-neutral-900 mb-4">
              Browse Our <span className="text-neutral-600">Collections</span>
            </h2>
            <p className="text-lg text-neutral-600 font-sans max-w-2xl mx-auto">
              Discover premium furniture for every room in your home
            </p>
          </div>

          {/* 4 columns desktop, 2 tablet, 1 mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <ScrollReveal key={category.slug} delay={index * 100}>
                <Link
                  to={`/category/${category.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-neutral-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/30 to-transparent"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-serif font-medium text-white mb-1">{category.name}</h3>
                    <p className="text-sm text-neutral-200 mb-2">{category.description}</p>
                    <span className="inline-block text-xs text-[#D4AF37] font-medium">
                      {category.count}+ Products
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/10 transition-colors duration-300"></div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {
      }
      {!loading && (
        <section className="py-20 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-14">
              <span className="inline-block text-neutral-500 text-sm font-serif tracking-widest uppercase border-b border-neutral-300 pb-2 mb-4">
                Trending Now
              </span>
              <h2 className="text-4xl lg:text-5xl font-serif font-light text-neutral-900 mb-4">
                Best <span className="text-neutral-600">Sellers</span>
              </h2>
              <p className="text-lg text-neutral-600 font-sans max-w-2xl mx-auto">
                The most loved pieces chosen by discerning customers
              </p>
            </div>

            {/* Product Grid - 4 columns desktop, 2 tablet, 1 mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellerProducts.map((product, index) => (
                <ScrollReveal key={product._id} delay={index * 100}>
                  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Product Image */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={product.imageUrl || "/assets/no-image.png"}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      {/* Discount Badge */}
                      {product.discount > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{product.discount}%
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50">
                        <span className="text-lg text-red-500">♡</span>
                      </button>

                      {/* Quick Add Button */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <button className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-[#D4AF37] hover:text-neutral-900 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="text-base font-serif font-medium text-neutral-900 mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex text-[#D4AF37] text-sm">
                          {'★'.repeat(Math.floor(product.rating))}
                        </div>
                        <span className="text-xs text-neutral-500">({product.reviews})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-neutral-900">
                          ₹{product.price?.toLocaleString('en-IN') || 'N/A'}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-neutral-400 line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center mt-12">
              <Link
                to="/category/best-sellers"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-neutral-900 font-serif text-lg tracking-wide rounded-xl hover:shadow-2xl hover:shadow-[#D4AF37]/25 transition-all duration-500 transform hover:-translate-y-1"
              >
                View All Products
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: WHY CHOOSE US - Minimal Trust Section */}
      <section className="py-16 bg-white border-y border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {/* 4 columns on desktop, 2x2 on tablet, 1x4 on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustFeatures.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: MID-PAGE PROMO BANNER */}
      <section className="py-20 bg-neutral-900 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={promoBanner.image} 
            alt="Promo"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 to-neutral-900/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
          <div className="max-w-2xl">
<ScrollReveal>
              <div className="inline-block bg-[#D4AF37] text-neutral-900 text-sm font-bold px-4 py-1 rounded-full mb-4">
                Limited Time Offer
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={100}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4">
                {promoBanner.title}
              </h2>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <h3 className="text-2xl md:text-3xl font-serif text-[#D4AF37] mb-4">
                {promoBanner.subtitle}
              </h3>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
              <p className="text-lg text-neutral-300 mb-8 max-w-lg">
                {promoBanner.description}
              </p>
            </ScrollReveal>
            
            <ScrollReveal delay={400}>
              <Link
                to="/category/bedroom"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#D4AF37] text-neutral-900 font-serif text-lg tracking-wide rounded-lg hover:bg-[#E5C158] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#D4AF37]/30"
              >
                {promoBanner.cta}
                <span className="ml-2">→</span>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION: CUSTOMER REVIEWS */}
      <section className="py-20 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-neutral-500 text-sm font-serif tracking-widest uppercase border-b border-neutral-300 pb-2 mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl lg:text-5xl font-serif font-light text-neutral-900 mb-4">
              What Our <span className="text-neutral-600">Customers Say</span>
            </h2>
            <p className="text-lg text-neutral-600 font-sans max-w-2xl mx-auto">
              Real stories from real customers who trust our craftsmanship
            </p>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.slice(0, 6).map((testimonial, index) => (
              <ScrollReveal key={testimonial.id} delay={index * 150}>
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  {/* Rating */}
                  <div className="flex text-[#D4AF37] mb-4">
                    {'★'.repeat(testimonial.rating)}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-neutral-600 mb-6 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                      <div className="text-sm text-neutral-500">{testimonial.location}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: STATS SECTION */}
      <section className="py-16 bg-[#D4AF37]">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target="500" suffix="+" />
              </div>
              <div className="text-amber-100 text-sm">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target="1000" suffix="+" />
              </div>
              <div className="text-amber-100 text-sm">Products</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target="50" suffix="+" />
              </div>
              <div className="text-amber-100 text-sm">Cities Served</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target="10" suffix="+" />
              </div>
              <div className="text-amber-100 text-sm">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: CTA SECTION */}
      <section className="py-20 bg-neutral-900 text-white">

        <div className="mx-auto max-w-4xl px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Ready to Transform Your Home?
          </h2>
          <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
            Browse our collection and find the perfect pieces for your space
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/category/bedroom"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#D4AF37] text-neutral-900 font-serif text-lg rounded-lg hover:bg-[#E5C158] transition-all duration-300"
            >
              Start Shopping
            </Link>
            <Link
              to="/help-center"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-serif text-lg rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              Get Help
            </Link>
          </div>
        </div>
      </section>

      {/* bottom padding to avoid bumping fixed UI (mobile bottom nav / safe area) */}
      <div className="safe-area-pb" />

      {/* SECTION: LIVING ROOM ELEGANCE BANNER (BOTTOM) */}
      <section className="pt-32 md:pt-24 bg-neutral-900 relative overflow-hidden">

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=600&fit=crop&crop=center"
            alt="Living Room Elegance"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 to-neutral-900/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
          <div className="max-w-2xl">
            <ScrollReveal>
              <div className="inline-block bg-[#D4AF37] text-neutral-900 text-sm font-bold px-4 py-1 rounded-full mb-4">
                Living Room Elegance
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4">
                Living Room
                <span className="text-[#D4AF37]">Elegance</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <h3 className="text-2xl md:text-3xl font-serif text-[#D4AF37] mb-4">
                Solid Wood Comfort
              </h3>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <p className="text-lg text-neutral-300 mb-8 max-w-lg">
                Premium comfort crafted for the heart of your home—designed to impress and built to last.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <Link
                to="/living-room"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#D4AF37] text-neutral-900 font-serif text-lg tracking-wide rounded-lg hover:bg-[#E5C158] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#D4AF37]/30"
              >
                Shop Living Room
                <span className="ml-2">→</span>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}


export default Home;

