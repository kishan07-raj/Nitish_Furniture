import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import axios from "axios";
import App from "./App.jsx";
import "./index.css";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Home from "./pages/Home.jsx";
import Product from "./pages/Product.jsx";
import CategoryProducts from "./pages/CategoryProducts.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import Stores from "./pages/Stores.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Profile from "./pages/Profile.jsx";
import Compare from "./pages/Compare.jsx";
import HelpCenter from "./pages/HelpCenter.jsx";
import AIAvatarAssistant from "./components/AIAvatarAssistant.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";

// Set axios defaults for all API calls
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "/api";

const router = createBrowserRouter([
  {
    path: "*",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "product/:slug", element: <Product /> },
      { path: "category/:slug", element: <CategoryProducts /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <LoginPage /> },
      { path: "orders/:id", element: <OrderDetails /> },
      { path: "stores", element: <Stores /> },
      { path: "wishlist", element: <Wishlist /> },
      { path: "profile", element: <Profile /> },
      { path: "compare", element: <Compare /> },
      { path: "help-center", element: <HelpCenter /> },
      { path: "ai-avatar", element: <AIAvatarAssistant /> },
      { path: "admin", element: <AdminDashboard /> },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SocketProvider>
              <RouterProvider router={router} />
            </SocketProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

