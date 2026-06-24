// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import BottomNav from "./components/BottomNav.jsx";
import DarkModeToggle from "./components/DarkModeToggle.jsx";
import Home from "./pages/Home.jsx";
import Product from "./pages/Product.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import CategoryProducts from "./pages/CategoryProducts.jsx";
import RoomSetup from "./pages/RoomSetup.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import Stores from "./pages/Stores.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import Profile from "./pages/Profile.jsx";
import Compare from "./pages/Compare.jsx";
import HelpCenter from "./pages/HelpCenter.jsx";
import AIAvatarAssistant from "./components/AIAvatarAssistant.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import AICartBuilder from "./components/AICartBuilder.jsx";
import AICartPage from "./pages/AICartPage.jsx";

import ProductList from "./components/ProductList.jsx";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminProductsPage from "./admin/AdminProductsPage.jsx";
import AdminOrdersPage from "./admin/AdminOrdersPage.jsx";
import AdminUsersPage from "./admin/AdminUsersPage.jsx";
import AdminInventoryPage from "./admin/AdminInventoryPage.jsx";
import AdminFinancePage from "./admin/AdminFinancePage.jsx";
import AdminSettingsPage from "./admin/AdminSettingsPage.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CompareProvider } from "./context/CompareContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  const location = useLocation();

  useEffect(() => {
    // Smooth scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Check if we should show mobile bottom nav (on non-admin routes and on mobile)
  const showBottomNav = !location.pathname.startsWith('/admin') && 
    location.pathname !== '/checkout' &&
    location.pathname !== '/login' &&
    location.pathname !== '/register';

  return (
    <AuthProvider>
      <CartProvider>
        <CompareProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-slate-100">
            <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
            {/* Only show main navbar/footer for non-admin routes */}
            {!location.pathname.startsWith('/admin') && (
              <>
                <Navbar />
                <main className={`flex-1 ${location.pathname === '/' ? '' : 'pt-32 md:pt-24'}`}>
                  {/* Smooth transitions between pages */}
                  <Routes location={location}>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/product/:slug" element={<Product />} />
                    <Route path="/category/:category/:subcategory" element={<CategoryPage />} />
                    <Route path="/category/:slug" element={<CategoryProducts />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<LoginPage />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/orders/:id" element={<OrderDetails />} />
                    <Route path="/stores" element={<Stores />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/help-center" element={<HelpCenter />} />
                    <Route path="/ai-avatar" element={<AIAvatarAssistant />} />
                    <Route path="/ai-cart" element={<AICartPage />} />
                    <Route path="/track-order" element={<OrderTracking />} />

                    {/* Dedicated collection listing pages */}
                    <Route path="/living-room" element={<ProductList title="Living Room" categorySlug="living" />} />
                    <Route path="/storage-beds" element={<ProductList title="Storage" categorySlug="storage" />} />
                    <Route path="/recliners" element={<ProductList title="Recliners" categorySlug="living" />} />
                  </Routes>
                </main>
                <Footer />
              </>
            )}

            {/* Mobile Bottom Navigation - Fixed at bottom */}
            {showBottomNav && <BottomNav />}

            {/* Admin routes - full screen layout */}
            <Routes>
              <Route element={<ProtectedRoute requiredRole={["owner", "admin", "manager", "staff"]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  {/* Dashboard */}
                  <Route index element={<AdminDashboard />} />
                  
                  {/* Products */}
                  <Route path="products" element={<AdminProductsPage />} />
                  
                  {/* Orders */}
                  <Route path="orders" element={<AdminOrdersPage />} />
                  
                  {/* Users */}
                  <Route path="users" element={<AdminUsersPage />} />
                  
                  {/* Inventory */}
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  
                  {/* Finance */}
                  <Route path="finance" element={<AdminFinancePage />} />
                  
                  {/* CMS */}
                  <Route path="cms" element={<div className="p-6"><h1 className="text-2xl font-semibold">CMS Management</h1><p className="mt-2 text-slate-600">Coming soon...</p></div>} />
                  
                  {/* Settings */}
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </CompareProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
