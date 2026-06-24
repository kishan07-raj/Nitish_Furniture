import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

import { livingRoomMegaMenu } from "../data/sofaCategories";
import { bedroomMegaMenu } from "../data/bedroomCategories";
import { mattressMegaMenu } from "../data/mattressCategories";
import { diningRoomMegaMenu } from "../data/diningCategories";

import { storageMegaMenu } from "../data/storageCategories";
import { studyMegaMenu } from "../data/studyCategories";
import { homeDecorMegaMenu } from "../data/decorCategories";
import { modularSolutionsMegaMenu } from "../data/modularCategories";
import { kidsMegaMenu } from "../data/kidsCategories"; 

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Mobile states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  // Scroll state for dynamic header effects
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('up');


  const [hoverTimeout, setHoverTimeout] = useState(null);


  const handleMenuToggle = (menuKey) => {
    setActiveMenu(activeMenu === menuKey ? null : menuKey);
  };

  // Handle hover for desktop
  const handleMenuHover = (menuKey) => {
    if (window.innerWidth >= 1024) { // Desktop only
      clearTimeout(hoverTimeout);
      setActiveMenu(menuKey);
    }
  };

  const handleMenuLeave = () => {
    if (window.innerWidth >= 1024) { // Desktop only
      const timeout = setTimeout(() => {
        setActiveMenu(null);
      }, 300); // Delay to allow moving to mega menu
      setHoverTimeout(timeout);
    }
  };

  const { user, logout } = useAuth();
  const { addToCart, itemsCount } = useCart();
  const { wishlistCount } = useWishlist();

 
  const posterImages = {
    'living-room': {
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=800&fit=crop",
      title: "Luxury Living",
      subtitle: "Redefine your space",
      cta: "Shop Now"
    },
    'bedroom': {
      image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&h=800&fit=crop",
      title: "Serene Bedrooms",
      subtitle: "Your sanctuary awaits",
      cta: "Explore"
    },
    'dining-room': {
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=800&fit=crop",
      title: "Elegant Dining",
      subtitle: "Memories made here",
      cta: "View Collection"
    },
    'office-study': {
      image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=800&fit=crop",
      title: "Productive Spaces",
      subtitle: "Work in style",
      cta: "Discover"
    },
    'kids': {
      image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=800&fit=crop",
      title: "Kids Paradise",
      subtitle: "Fun & functional",
      cta: "Browse"
    },
    'storage': {
      image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600&h=800&fit=crop",
      title: "Smart Storage",
      subtitle: "Organize effortlessly",
      cta: "Shop Storage"
    },
    'home-decor': {
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=800&fit=crop",
      title: "Home Accents",
      subtitle: "Complete the look",
      cta: "Explore Decor"
    },
    'modular': {
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=800&fit=crop",
      title: "Modular Magic",
      subtitle: "Customize your space",
      cta: "Get Quote"
    },
    'mattresses': {
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=800&fit=crop",
      title: "Better Sleep",
      subtitle: "Wake refreshed",
      cta: "Shop Mattresses"
    },
  };

  const menuData = {
    'living-room': { title: "Living Room Furniture", data: livingRoomMegaMenu, poster: posterImages['living-room'] },
    'bedroom': { title: "Bedroom Furniture", data: bedroomMegaMenu, poster: posterImages['bedroom'] },
    'dining-room': { title: "Dining Room Furniture", data: diningRoomMegaMenu, poster: posterImages['dining-room'] },
    'office-study': { title: "Office & Study Furniture", data: studyMegaMenu, poster: posterImages['office-study'] },
    'kids': { title: "Kids Furniture", data: kidsMegaMenu, poster: posterImages['kids'] },
    'storage': { title: "Storage Solutions", data: storageMegaMenu, poster: posterImages['storage'] },
    'home-decor': { title: "Home Decor", data: homeDecorMegaMenu, poster: posterImages['home-decor'] },
    'modular': { title: "Modular Solutions", data: modularSolutionsMegaMenu, poster: posterImages['modular'] },
    'mattresses': { title: "Mattresses", data: mattressMegaMenu, poster: posterImages['mattresses'] },
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeaderVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';

      setScrollY(currentScrollY);
      setScrollDirection(direction);
      setIsScrolled(currentScrollY > 50);

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate header height for fixed positioning
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Handle menu item clicks
  const handleMenuClick = (item) => {
    if (location.pathname === '/') {
      // If on home page, scroll to categories section
      const element = document.getElementById('categories-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Otherwise, navigate to category page
      navigate(`/category/${encodeURIComponent(item)}`);
    }
  };

  // Search handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/stores?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSearchDropdown(false);
    }
  };

  // Search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const results = await res.json();
        setSearchResults(results);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Search failed", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setShowSearchDropdown(false);
      setSearchResults([]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchDropdown(false);
    };
    if (showSearchDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSearchDropdown]);

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.mega-menu-container')) {
        setActiveMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [activeMenu]);

  // Mobile drawer: close on Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header ref={headerRef} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    } ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50'
        : 'bg-white shadow-sm'
    }`}>
      {/* Top strip */}
      <div className="hidden border-b bg-rose-50 text-[11px] text-slate-600 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5">
          <div className="flex items-center gap-4">
            <button className="text-rose-800 font-medium">Furniture</button>
            <button className="hover:text-slate-900">Home Interiors</button>
            <button className="hover:text-slate-900">Bulk Order</button>
          </div>
          <div className="flex items-center gap-4">
            <span>📞 +91-6200694677</span>
            <button className="hover:text-slate-900">Become a Franchise</button>
            <button className="hover:text-slate-900">Track Order</button>
            <Link to="/help-center" className="hover:text-slate-900">Help Center</Link>
          </div>
        </div>
      </div>

      {/* Main row: Mobile-first design */}
      <div className="px-4 py-3 md:px-6 md:py-3">
        {/* Mobile Header */}
        <div className="flex items-center justify-between md:hidden">
          {/* Mobile Logo - no tagline */}
          <Link to="/" className="flex items-center">
            <span className="text-lg font-semibold tracking-tight">
              Nitish <span className="text-amber-800">Furniture</span>
            </span>
          </Link>

          {/* Mobile Right Actions: Search + Cart + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchOverlayOpen(true)}
              className="p-2 text-slate-600 hover:text-amber-800 transition-colors duration-300"
            >
              <span className="text-xl">🔍</span>
            </button>



            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:text-amber-800 transition-colors duration-300"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex max-w-7xl mx-auto flex-wrap items-center gap-3">
          {/* Desktop Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-semibold tracking-tight">
                Nitish <span className="text-amber-800">Furniture</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Solid wood • bonded with craft
              </span>
            </div>
          </Link>

          {/* Desktop Search bar */}
          <div className="relative flex w-full items-center md:flex-1">
            <div className={`flex w-full items-center gap-2 rounded-full border px-4 py-2 text-sm text-slate-700 transition-all duration-300 ${
              searchQuery.length > 0
                ? 'border-amber-700 bg-white/95 backdrop-blur-sm shadow-lg'
                : 'border-slate-300 bg-slate-50 focus-within:border-amber-700 focus-within:bg-white/95 focus-within:backdrop-blur-sm'
            }`}>
              <span className={`transition-all duration-300 ${
                searchQuery.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'
              }`}>
                🔍
              </span>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, wood, finish & more..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 transition-all duration-300"
                />
              </form>
              {searchLoading && (
                <span className="text-amber-600 animate-spin">⏳</span>
              )}
            </div>

            {/* Search dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {searchResults.map((product) => (
                  <div key={product._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                    <img
                      src={product.images?.[0] || "/placeholder.jpg"}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 truncate">{product.name}</h4>
                      <p className="text-xs text-slate-600">₹{product.basePrice?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${product.slug}`}
                        className="px-3 py-1 text-xs bg-amber-800 text-white rounded hover:bg-amber-900"
                        onClick={() => setShowSearchDropdown(false)}
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => {
                          addToCart(product);
                          setShowSearchDropdown(false);
                        }}
                        className="px-3 py-1 text-xs bg-slate-800 text-white rounded hover:bg-slate-900"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Right actions */}
          <div className="flex items-center gap-4 text-[11px] text-slate-700">
            <Link to="/stores" className="flex flex-col items-center hover:text-amber-800">
              <span className="text-lg">🏬</span>
              <span>Stores</span>
            </Link>

            {/* Admin link sirf admin user ke liye */}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="flex flex-col items-center text-amber-800 font-semibold"
              >
                <span className="text-lg">🛠️</span>
                <span>Admin</span>
              </Link>
            )}

            {/* Auth section */}
            {user ? (
              <>
                <Link
                  to="/orders"
                  className="flex flex-col items-center hover:text-amber-800 relative"
                >
                  <span className="text-lg">📦</span>
                  <span>Orders</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex flex-col items-center hover:text-amber-800"
                >
                  <span className="text-lg">👤</span>
                  <span>{user.name?.split(" ")[0] || "Profile"}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex flex-col items-center text-red-500 hover:text-red-600"
                >
                  <span className="text-lg">⏏</span>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex flex-col items-center hover:text-amber-800"
              >
                <span className="text-lg">👤</span>
                <span>Login</span>
              </Link>
            )}

            <Link
              to="/wishlist"
              className="flex flex-col items-center hover:text-amber-800 relative"
            >
              <span className="text-lg">♡</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
              <span>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span>
            </Link>

            {/* Help Center (mobile only - hide on desktop) */}
            <Link
              to="/help-center"
              className="hidden md:flex flex-col items-center hover:text-amber-800"
            >
              <span className="text-lg">💬</span>
              <span>Help Center</span>
            </Link>

            <Link
              to="/cart"
              className="flex flex-col items-center hover:text-amber-800 relative"
            >
              <span className="text-lg">🛒</span>
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemsCount > 9 ? '9+' : itemsCount}
                </span>
              )}
              <span>Cart{itemsCount > 0 ? ` (${itemsCount})` : ''}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category nav row - Hidden on mobile */}
      <div className="hidden md:block border-b bg-white">
        <nav className="mega-menu-container relative mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-2 text-sm text-slate-600">
          {/* Living Room Furniture Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('living-room')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('living-room')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Living Room
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Bedroom Furniture Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('bedroom')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('bedroom')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Bedroom
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Dining Room Furniture Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('dining-room')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('dining-room')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Dining Room
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Office & Study Furniture Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('office-study')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('office-study')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Office & Study
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Kids Furniture Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('kids')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('kids')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Kids
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Storage Solutions Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('storage')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('storage')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Storage
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Home Decor Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('home-decor')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('home-decor')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Home Decor
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Modular Solutions Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('modular')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('modular')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Modular
              <span className="text-xs">▼</span>
            </button>
          </div>

          {/* Mattresses Menu */}
          <div className="relative" onMouseEnter={() => handleMenuHover('mattresses')} onMouseLeave={handleMenuLeave}>
            <button
              onClick={() => handleMenuToggle('mattresses')}
              className="pb-1 hover:text-slate-900 flex items-center gap-1"
            >
              Mattresses
              <span className="text-xs">▼</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Backdrop overlay */}
      {activeMenu && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* Mega Menu Overlay - 3 Column Layout */}
      {activeMenu && menuData[activeMenu] && (
        <PremiumMegaPanel
          title={menuData[activeMenu].title}
          data={menuData[activeMenu].data}
          poster={menuData[activeMenu].poster}
          headerHeight={headerHeight}
          onItemClick={(item) => {
            const slug = item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            navigate(`/category/${activeMenu}/${slug}`);
            setActiveMenu(null);
          }}
          onClose={() => setActiveMenu(null)}
        />
      )}

      {/* Mobile Search Overlay */}
      {isSearchOverlayOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-60"
            onClick={() => setIsSearchOverlayOpen(false)}
          />

          {/* Search Overlay */}
          <div className="fixed top-0 left-0 right-0 z-70 bg-white shadow-xl border-b border-slate-200/50 transform transition-transform duration-400 ease-out">
            <div className="px-4 py-6">
              {/* Close button */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Search Products</h2>
                <button
                  onClick={() => setIsSearchOverlayOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors duration-300"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* Full-width search input */}
              <div className="relative">
                <div className="flex w-full items-center gap-3 rounded-full border-2 border-amber-700 bg-white px-6 py-4 text-lg text-slate-700 shadow-lg">
                  <span className="text-amber-600 text-xl">🔍</span>
                  <form onSubmit={handleSearchSubmit} className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products, wood, finish & more..."
                      className="flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                      autoFocus
                    />
                  </form>
                  {searchLoading && (
                    <span className="text-amber-600 animate-spin text-xl">⏳</span>
                  )}
                </div>

                {/* Search results */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                    {searchResults.map((product) => (
                      <div key={product._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                        <img
                          src={product.images?.[0] || "/placeholder.jpg"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium text-slate-900 truncate">{product.name}</h4>
                          <p className="text-sm text-slate-600">₹{product.basePrice?.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-3">
                          <Link
                            to={`/product/${product.slug}`}
                            className="px-4 py-2 text-sm bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors duration-300"
                            onClick={() => {
                              setIsSearchOverlayOpen(false);
                              setShowSearchDropdown(false);
                            }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => {
                              addToCart(product);
                              setIsSearchOverlayOpen(false);
                              setShowSearchDropdown(false);
                            }}
                            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors duration-300"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Hamburger Drawer Menu with Accordion */}
      {isMobileMenuOpen && (
        <MobileDrawerMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          menuData={menuData}
          user={user}
          logout={logout}
        />
      )}
    </header>
  );
}

function PremiumMegaPanel({ title, data, poster, headerHeight, onItemClick, onClose }) {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState(null);

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      navigate(`/category/${encodeURIComponent(item)}`);
    }
  };

  const groupedData = {
    'By Type': data.slice(0, Math.ceil(data.length / 2)),
    'By Material': data.slice(Math.ceil(data.length / 2)),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="
        fixed inset-0 z-80
        bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-200/60
        overflow-hidden
      "
      style={{
        top: window.innerWidth >= 1024 ? `${headerHeight}px` : '0',
        height: window.innerWidth >= 1024 ? `calc(100vh - ${headerHeight}px)` : '100vh'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Premium Header - Gold Gradient */}
      <div className="relative bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] px-6 lg:px-8 py-4 lg:py-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-xl lg:text-2xl font-bold tracking-tight">{title}</h3>
            <p className="text-white/80 mt-1 lg:mt-2 text-sm">Discover premium craftsmanship for your home</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all duration-300 hover:rotate-90"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        <div className="absolute -right-4 -top-4 w-16 lg:w-24 h-16 lg:h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -left-4 -bottom-4 w-12 lg:w-16 h-12 lg:h-16 bg-white/10 rounded-full blur-lg"></div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid lg:grid-cols-4 h-full">
        {/* Left Column - Main Categories */}
        <div className="lg:col-span-1 border-r border-slate-200 bg-slate-50/50 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-3 bg-[#D4AF37] rounded-full"></span>
              Browse Categories
            </h4>
            <ul className="space-y-1">
              {data.map((group, index) => (
                <li key={group.title}>
                  <button
                    onClick={() => setActiveGroup(activeGroup === index ? null : index)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-lg transition-all duration-300 flex items-center justify-between group"
                  >
                    <span>{group.title}</span>
                    <span className={`text-xs transition-transform duration-300 ${activeGroup === index ? 'rotate-90' : ''}`}>▶</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle Column - Grouped Subcategories */}
        <div className="lg:col-span-2 border-r border-slate-200 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {/* Grouped by Type and Material */}
            {Object.entries(groupedData).map(([groupName, groups]) => (
              <div key={groupName} className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 bg-[#D4AF37] rounded-full"></span>
                  {groupName}
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <div key={group.title} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/5 transition-all duration-300 group">
                      <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#D4AF37] rounded-full"></span>
                        {group.title}
                      </h5>
                      <ul className="space-y-1">
                        {group.items.slice(0, 6).map((item) => (
                          <li key={item}>
                            <button
                              onClick={() => handleItemClick(item)}
                              className="text-xs text-slate-600 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 px-2 py-1.5 rounded transition-all duration-300 w-full text-left"
                            >
                              {item}
                            </button>
                          </li>
                        ))}
                        {group.items.length > 6 && (
                          <li>
                            <button
                              onClick={() => handleItemClick(group.title)}
                              className="text-xs text-[#D4AF37] hover:text-[#B8960B] font-medium px-2 py-1"
                            >
                              +{group.items.length - 6} more
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick Links */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Links</h4>
              <div className="flex flex-wrap gap-2">
                {['New Arrivals', 'Best Sellers', 'On Sale', 'Custom Furniture'].map((link) => (
                  <button
                    key={link}
                    onClick={() => handleItemClick(link)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-full border border-slate-200 hover:border-[#D4AF37]/30 hover:shadow-md transition-all duration-300"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Poster Panel with Enhanced Effects */}
        <div className="hidden lg:block lg:col-span-1 relative overflow-hidden">
          {/* Gradient Background - Gold Tones */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] via-[#E5C158] to-[#B8960B]"></div>
          
          {/* Content */}
          <div className="relative z-10 p-6 flex flex-col h-full justify-between">
            {/* Poster Image with Enhanced Hover */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-4 group">
              <motion.img 
                src={poster.image} 
                alt={poster.title}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h5 className="text-white text-xl font-bold">{poster.title}</h5>
                <p className="text-white/80 text-sm">{poster.subtitle}</p>
              </div>
            </div>

            {/* CTA Button with Glow Effect */}
            <motion.button
              onClick={() => {
                
                const posterKey = (poster?.title || "").toLowerCase();
                if (posterKey.includes("living")) return navigate("/living-room");
                if (posterKey.includes("storage")) return navigate("/storage-beds");
                if (posterKey.includes("recliner")) return navigate("/recliners");
                // Fallback: keep existing behavior
                handleItemClick(poster.title);
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-[#D4AF37] font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              {poster.cta}
              <span>→</span>
            </motion.button>

            {/* Stats with Glassmorphism */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-md rounded-lg p-2 border border-white/20"
              >
                <div className="text-white font-bold text-lg">50K+</div>
                <div className="text-white/70 text-xs">Happy Customers</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-md rounded-lg p-2 border border-white/20"
              >
                <div className="text-white font-bold text-lg">10+</div>
                <div className="text-white/70 text-xs">Years Experience</div>
              </motion.div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>
    </motion.div>
  );
}

/** Mobile Full-Screen Menu with Accordion */
function MobileDrawerMenu({ onClose, menuData, user, logout }) {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  const menuKeys = Object.keys(menuData);

  const handleCategoryClick = (key) => {
    setExpandedCategory(expandedCategory === key ? null : key);
    setExpandedItem(null);
  };

  const handleItemClick = (item) => {
    const slug = item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    navigate(`/category/${slug}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Slide-down Drawer */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div
          className="pointer-events-auto absolute inset-x-0 top-0"
          role="dialog"
          aria-modal="true"
        >
          {/* Drawer container with smooth enter */}
          <div
            className="bg-white border-b border-slate-200 h-[calc(100vh)] overflow-hidden transform translate-y-0 transition-transform duration-300 ease-out"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white">
              <Link to="/" onClick={onClose} className="flex items-center">
                <span className="text-lg font-semibold tracking-tight">
                  Nitish <span className="text-amber-800">Furniture</span>
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Scrollable content area */}
            <div className="h-[calc(100vh-72px)] overflow-y-auto">
              {/* Navigation Links */}
              <div className="p-4 border-b border-slate-200">
                <Link
                  to="/"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-300"
                >
                  <span className="text-xl">🏠</span>
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  to="/shop"
                  onClick={onClose}
                  className="mt-2 flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-300"
                >
                  <span className="text-xl">🛍️</span>
                  <span className="font-medium">Shop</span>
                </Link>
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="mt-2 flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-300"
                >
                  <span className="text-xl">🛒</span>
                  <span className="font-medium">Cart</span>
                </Link>
                <Link
                  to="/wishlist"
                  onClick={onClose}
                  className="mt-2 flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-300"
                >
                  <span className="text-xl">♡</span>
                  <span className="font-medium">Wishlist</span>
                </Link>

                {/* Help Center (mobile only - below Wishlist/Profile) */}
                <Link
                  to="/help-center"
                  onClick={onClose}
                  className="mt-2 flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-300"
                >
                  <span className="text-xl">💬</span>
                  <span className="font-medium">Help Center</span>
                </Link>
              </div>

              {/* Categories Accordion */}
              <div className="p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">Categories</h3>
                <div className="space-y-2">
                  {menuKeys.map((key) => (
                    <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => handleCategoryClick(key)}
                        className="w-full px-4 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-900">{menuData[key].title}</span>
                        <span
                          className={`text-amber-600 transition-transform duration-300 ${expandedCategory === key ? 'rotate-180' : ''}`}
                        >
                          ▼
                        </span>
                      </button>

                      {expandedCategory === key && (
                        <div className="bg-white">
                          {menuData[key].data.map((group, gIndex) => (
                            <div key={group.title} className="border-b border-slate-100 last:border-b-0">
                              <button
                                onClick={() =>
                                  setExpandedItem(
                                    expandedItem === `${key}-${gIndex}` ? null : `${key}-${gIndex}`
                                  )
                                }
                                className="w-full px-4 py-3 hover:bg-amber-50 transition-colors flex items-center justify-between"
                              >
                                <span className="text-sm font-medium text-slate-700">{group.title}</span>
                                <span
                                  className={`text-amber-600 text-xs transition-transform duration-300 ${expandedItem === `${key}-${gIndex}` ? 'rotate-180' : ''}`}
                                >
                                  ▶
                                </span>
                              </button>

                              {expandedItem === `${key}-${gIndex}` && (
                                <div className="bg-slate-50 px-4 py-2">
                                  {group.items.map((item) => (
                                    <button
                                      key={item}
                                      onClick={() => handleItemClick(item)}
                                      className="w-full text-left py-2 text-sm text-slate-600 hover:text-amber-700 hover:bg-amber-50 px-3 rounded transition-colors"
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auth Section */}
              <div className="p-4 border-t border-slate-200">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-300"
                    >
                      <span className="text-xl">👤</span>
                      <span className="font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300"
                    >
                      <span className="text-xl">⏏</span>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-300"
                  >
                    <span className="text-xl">👤</span>
                    <span className="font-medium">Login</span>
                  </Link>
                )}
              </div>

              {/* Contact Info */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-600 px-4">
                  <span>📞</span>
                  <span>+91-6200694677</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
