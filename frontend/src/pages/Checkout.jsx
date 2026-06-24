// frontend/src/pages/Checkout.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, itemsTotal, shippingCharge, tax, grandTotal, clearCart } = useCart();
  const { isAuthenticated, token, user } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD",
  });

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [orderSessionId] = useState(() => `ord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Check for existing order session on mount (prevent duplicate orders on refresh)
  useEffect(() => {
    const existingOrderSession = localStorage.getItem("nf_last_order_session");
    const orderCompleted = localStorage.getItem("nf_order_completed");
    
    if (existingOrderSession === orderSessionId && orderCompleted === "true") {
      // Order was already successfully placed in this session
      setError("This order has already been submitted.");
    }
  }, [orderSessionId]);

  // Saved addresses (localStorage)
  const [savedAddresses, setSavedAddresses] = useState(() => {
    const saved = localStorage.getItem("nf_addresses");
    return saved ? JSON.parse(saved) : [];
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const hasAddress =
    form.addressLine1 && form.city && form.state && form.pincode;

  const handlePlaceOrder = async () => {
    setError("");

    if (!isAuthenticated) {
      setError("Please login to place an order.");
      return;
    }

    // Validate and format phone number (10 digits, starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanedPhone = form.phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanedPhone)) {
      setError("Please enter a valid 10-digit phone number (e.g., 9876543210)");
      return;
    }

    // Validate pincode (6 digits)
    const pincodeRegex = /^[1-9]\d{5}$/;
    const cleanedPincode = form.pincode.replace(/\D/g, '');
    
    if (!pincodeRegex.test(cleanedPincode)) {
      setError("Please enter a valid 6-digit pincode (e.g., 123456)");
      return;
    }

    if (
      !form.fullName ||
      !form.email ||
      !form.addressLine1 ||
      !form.city ||
      !form.state
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (!cartItems.length) {
      setError("Your cart is empty.");
      return;
    }

    // Prevent double-click
    if (placing) return;

    setPlacing(true);
    try {
      // Save address if checkbox is checked
      if (saveAddress) {
        const id = Date.now().toString();
        const newAddress = { id, ...form, phone: cleanedPhone, pincode: cleanedPincode };
        const updated = [...savedAddresses, newAddress];
        setSavedAddresses(updated);
        localStorage.setItem("nf_addresses", JSON.stringify(updated));
      }

      const payload = {
        shippingAddress: {
          fullName: form.fullName,
          phone: cleanedPhone,
          email: form.email,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pincode: cleanedPincode,
        },
        items: cartItems.map((item) => {
          // Ensure quantity is a valid integer >= 1
          const quantity = parseInt(item.qty || item.quantity || 1);
          // Ensure price is a valid float >= 0
          const price = parseFloat(item.price || item.basePrice || 0);
          
          return {
            product: item._id || item.id || null,
            name: item.name || "Unknown Product",
            quantity: isNaN(quantity) ? 1 : Math.max(1, quantity),
            pricePerUnit: isNaN(price) ? 0 : Math.max(0, price),
            image: item.image || item.imageUrl || "",
          };
        }),
        paymentMethod: form.paymentMethod,
        totalAmount: Number(grandTotal) || 0,
        orderSessionId: orderSessionId,
      };

      // DEBUG: Log payload before sending
      console.log("[CHECKOUT] Payload:", JSON.stringify(payload, null, 2));
      console.log("[CHECKOUT] Token exists:", !!token);
      console.log("[CHECKOUT] Cart items count:", cartItems.length);

      const res = await axios.post("/orders", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // DEBUG: Log success response
      console.log("[CHECKOUT] Order success:", res.data);

      if (res.data.success) {
        // Mark order as completed in localStorage
        localStorage.setItem("nf_last_order_session", orderSessionId);
        localStorage.setItem("nf_order_completed", "true");
        
        // Set order details for modal
        setOrderId(res.data.order.orderId || res.data.order._id);
        setOrderDetails({
          items: cartItems.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price
          })),
          total: grandTotal
        });
        
        // Format estimated delivery date
        if (res.data.order.estimatedDelivery) {
          const deliveryDate = new Date(res.data.order.estimatedDelivery);
          setEstimatedDelivery(deliveryDate.toLocaleDateString("en-IN", {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }));
        }
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Clear cart after successful order
        clearCart();
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate("/my-orders");
        }, 3000);
      } else {
        setError(res.data.message || "Failed to place order.");
      }
    } catch (err) {
      // Handle duplicate order response
      if (err.response?.data?.isDuplicate) {
        setShowSuccessModal(true);
        setOrderId(err.response.data.order.orderId || err.response.data.order._id);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate("/my-orders");
        }, 3000);
      } else {
        // Log full error for debugging
        console.error("Order error:", err.response?.data || err.message);
        
        // Get detailed error message from backend
        const backendMessage = err.response?.data?.message;
        const backendError = err.response?.data?.error;
        const validationErrors = err.response?.data?.errors;
        
        let displayMessage = "Failed to place order. Please try again.";
        
        // Priority 1: Check for validation errors array
        if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
          displayMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(". ");
        }
        // Priority 2: Check for direct message
        else if (backendMessage) {
          displayMessage = backendMessage;
        }
        
        // Priority 3: Check for specific error patterns
        if (backendError) {
          console.error("Backend error details:", backendError);
        }
        
        // Handle specific validation errors with more helpful messages
        if (displayMessage.includes("phone")) {
          displayMessage = "Please enter a valid 10-digit phone number (e.g., 9876543210)";
        } else if (displayMessage.includes("pincode") || displayMessage.includes("postal")) {
          displayMessage = "Please enter a valid 6-digit pincode (e.g., 123456)";
        } else if (displayMessage.includes("quantity")) {
          displayMessage = "Please ensure all product quantities are valid";
        } else if (displayMessage.includes("price")) {
          displayMessage = "Please ensure all product prices are valid";
        } else if (displayMessage.includes("address")) {
          displayMessage = "Please fill in all required address fields";
        }
        
        setError(displayMessage);
      }
    } finally {
      setPlacing(false);
    }
  };

  const handleSelectSavedAddress = (id) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      const { id: _ignore, ...rest } = addr;
      setForm((prev) => ({
        ...prev,
        ...rest,
      }));
    }
  };

  const handleDeleteSavedAddress = (id) => {
    const updated = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem("nf_addresses", JSON.stringify(updated));
    if (selectedAddressId === id) {
      setSelectedAddressId("");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header + edit cart link */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <Link
          to="/cart"
          className="text-xs font-medium text-amber-800 hover:underline"
        >
          ‹ Edit cart
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr,1.2fr]">
        {/* Left: customer + address + payment */}
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5">
          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold">Contact details</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                name="fullName"
                placeholder="Full name *"
                value={form.fullName}
                onChange={handleChange}
                className="rounded-lg border px-3 py-2 text-sm"
                required
              />
              <input
                name="phone"
                placeholder="Phone *"
                value={form.phone}
                onChange={handleChange}
                className="rounded-lg border px-3 py-2 text-sm"
                required
              />
              <input
                name="email"
                placeholder="Email *"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
                required
              />
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h2 className="text-sm font-semibold">Shipping address</h2>

            {/* Saved addresses selector */}
            {savedAddresses.length > 0 && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Saved addresses</span>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => handleSelectSavedAddress(e.target.value)}
                    className="rounded-full border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="">Choose...</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} • {a.city}, {a.pincode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Small list with delete buttons */}
                <div className="space-y-1">
                  {savedAddresses.map((a) => (
                    <div
                      key={`row-${a.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1"
                    >
                      <span className="truncate text-[11px] text-slate-600">
                        {a.fullName} • {a.city}, {a.pincode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedAddress(a.id)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 grid gap-3">
              <input
                name="addressLine1"
                placeholder="Address line 1 *"
                value={form.addressLine1}
                onChange={handleChange}
                className="rounded-lg border px-3 py-2 text-sm"
                required
              />
              <input
                name="addressLine2"
                placeholder="Address line 2 (optional)"
                value={form.addressLine2}
                onChange={handleChange}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  name="city"
                  placeholder="City *"
                  value={form.city}
                  onChange={handleChange}
                  className="rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <input
                  name="state"
                  placeholder="State *"
                  value={form.state}
                  onChange={handleChange}
                  className="rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <input
                  name="pincode"
                  placeholder="Pincode *"
                  value={form.pincode}
                  onChange={handleChange}
                  className="rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            {hasAddress && (
              <p className="mt-2 text-[11px] text-slate-500">
                Delivering to: {form.city}, {form.state} – {form.pincode}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              <span>Save this address for next time</span>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h2 className="text-sm font-semibold">Payment method</h2>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={form.paymentMethod === "COD"}
                  onChange={handleChange}
                />
                <span>Cash on Delivery</span>
              </label>
              <label className="flex items-center gap-2 opacity-60">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  disabled
                  onChange={handleChange}
                />
                <span>Online payment (coming soon)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Order summary</h2>
            <span className="text-[11px] text-slate-500">
              {cartItems.length} item(s)
            </span>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto text-xs">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-slate-800">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Qty: {item.qty}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-700">
                  ₹{(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Items total</span>
              <span>₹{itemsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{shippingCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing || !cartItems.length}
            className="mt-2 w-full rounded-full bg-amber-900 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-50 hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {placing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              "Place order"
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="mx-4 rounded-2xl bg-white p-8 text-center shadow-2xl max-w-md w-full"
            >
              {/* Animated Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="h-12 w-12 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <h2 className="mb-2 text-2xl font-bold text-slate-900">
                Order Confirmed Successfully!
              </h2>
              <p className="mb-4 text-sm text-slate-600">
                Thank you for your order. We're preparing your furniture with care.
              </p>
              
              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Order ID</p>
                <p className="font-mono font-semibold text-slate-900">
                  {orderId}
                </p>
              </div>

              {estimatedDelivery && (
                <div className="mb-4 rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-green-600">Estimated Delivery</p>
                  <p className="font-medium text-green-800">{estimatedDelivery}</p>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Redirecting to your orders...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Checkout;
