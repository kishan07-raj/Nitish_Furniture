import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      setSubscribeError("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubscribeError("Please enter a valid email");
      return;
    }
    setSubscribeError("");
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  // Footer links data
  const shopCategories = [
    { name: "Living Room", link: "/category/living" },
    { name: "Bedroom", link: "/category/bedroom" },
    { name: "Dining", link: "/category/dining" },
    { name: "Office & Study", link: "/category/office" },
    { name: "Kids Furniture", link: "/category/kids" },
    { name: "Storage", link: "/category/storage" },
    { name: "Mattresses", link: "/category/mattress" },
    { name: "Home Decor", link: "/category/decor" },
  ];

  const customerService = [
    { name: "Contact Us", link: "/help-center" },
    { name: "FAQs", link: "/help-center" },
    { name: "Shipping Policy", link: "/help-center" },
    { name: "Returns & Exchanges", link: "/help-center" },
    { name: "Order Tracking", link: "/track-order" },
    { name: "Warranty Info", link: "/help-center" },
    { name: "Care Instructions", link: "/help-center" },
    { name: "Size Guide", link: "/help-center" },
  ];

  const aboutLinks = [
    { name: "About Us", link: "/about" },
    { name: "Our Story", link: "/about" },
    { name: "Craftsmanship", link: "/about" },
    { name: "Sustainability", link: "/about" },
    { name: "Careers", link: "/careers" },
    { name: "Press", link: "/press" },
    { name: "Blog", link: "/blog" },
  ];

  const socialLinks = [
    { name: "Facebook", icon: "📘", link: "#" },
    { name: "Instagram", icon: "📸", link: "#" },
    { name: "Twitter", icon: "🐦", link: "#" },
    { name: "Pinterest", icon: "📌", link: "#" },
    { name: "YouTube", icon: "📺", link: "#" },
  ];

  return (
    <footer className="bg-neutral-900 text-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Shop Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-amber-400">Shop Categories</h3>
            <ul className="space-y-3">
              {shopCategories.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.link}
                    className="text-neutral-400 hover:text-amber-400 transition-colors duration-300 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-amber-400">Customer Service</h3>
            <ul className="space-y-3">
              {customerService.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.link}
                    className="text-neutral-400 hover:text-amber-400 transition-colors duration-300 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: About */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-amber-400">About Us</h3>
            <ul className="space-y-3">
              {aboutLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.link}
                    className="text-neutral-400 hover:text-amber-400 transition-colors duration-300 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Social */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-amber-400">Connect With Us</h3>
            
            {/* Contact Info */}
            <div className="mb-6">
              <p className="text-neutral-400 text-sm mb-2">📍 Jodhpur, Rajasthan, India</p>
              <p className="text-neutral-400 text-sm mb-2">📞 +91-6200694677</p>
              <p className="text-neutral-400 text-sm">✉️ info@nitishfurniture.com</p>
            </div>

            {/* Social Links */}
            <div className="mb-6">
              <p className="text-sm text-neutral-400 mb-3">Follow us:</p>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.link}
                    className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-lg hover:bg-amber-600 transition-all duration-300 hover:scale-110"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div>
              <p className="text-sm text-neutral-400 mb-3">Subscribe for updates</p>
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2 bg-neutral-800 text-white text-sm rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-r-lg hover:bg-amber-700 transition-colors"
                >
                  →
                </motion.button>
              </form>
              <AnimatePresence>
                {subscribeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-400 text-xs mt-2"
                  >
                    {subscribeError}
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {subscribed && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-green-400 text-xs mt-2"
                  >
                    ✓ Thanks for subscribing!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-semibold tracking-tight">
                  Nitish <span className="text-amber-400">Furniture</span>
                </span>
              </Link>
              <span className="text-neutral-500 text-sm">
                © {currentYear} All rights reserved
              </span>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-2 text-neutral-400 text-sm">
              <span className="mr-2">Secure Payments:</span>
              <span className="bg-neutral-800 px-2 py-1 rounded text-xs">💳 Visa</span>
              <span className="bg-neutral-800 px-2 py-1 rounded text-xs">💳 Mastercard</span>
              <span className="bg-neutral-800 px-2 py-1 rounded text-xs">📱 UPI</span>
              <span className="bg-neutral-800 px-2 py-1 rounded text-xs">🏦 Bank Transfer</span>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-4 text-sm">
              <Link to="/privacy" className="text-neutral-400 hover:text-amber-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-neutral-400 hover:text-amber-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-neutral-400 hover:text-amber-400 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
