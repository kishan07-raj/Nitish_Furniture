import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const OrderTracking = () => {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrderData(null);

    // Simulate API call
    setTimeout(() => {
      // Mock order data for demonstration
      if (orderId) {
        setOrderData({
          orderId: orderId,
          status: "processing",
          estimatedDelivery: "5-7 days",
          items: [
            { name: "Premium Sheesham Wood Sofa", quantity: 1, price: 89999 },
          ],
          timeline: [
            { status: "Order Placed", date: "2024-01-15", completed: true },
            { status: "Payment Confirmed", date: "2024-01-15", completed: true },
            { status: "Processing", date: "2024-01-16", completed: true },
            { status: "Shipped", date: "Pending", completed: false },
            { status: "Out for Delivery", date: "Pending", completed: false },
            { status: "Delivered", date: "Pending", completed: false },
          ],
          shippingAddress: {
            name: "John Doe",
            address: "123 Main Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
        });
      } else {
        setError("Please enter a valid order ID");
      }
      setLoading(false);
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-serif font-bold text-neutral-900 mb-4">
            Track Your Order
          </h1>
          <p className="text-neutral-600">
            Enter your order details to track your furniture delivery
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleTrack}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-123456"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-neutral-900 font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all disabled:opacity-50"
          >
            {loading ? "Tracking..." : "Track Order"}
          </motion.button>
        </motion.form>

        {/* Order Status */}
        {orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Order Header */}
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-neutral-400 text-sm">Order ID</p>
                  <p className="text-white text-xl font-semibold">{orderData.orderId}</p>
                </div>
                <div className={`px-4 py-2 rounded-full ${getStatusColor(orderData.status)} text-white font-medium`}>
                  {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Order Timeline</h3>
              <div className="space-y-4">
                {orderData.timeline.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          step.completed ? "bg-[#D4AF37]" : "bg-neutral-300"
                        }`}
                      />
                      {index < orderData.timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${
                            step.completed ? "bg-[#D4AF37]" : "bg-neutral-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={`font-medium ${step.completed ? "text-neutral-900" : "text-neutral-400"}`}>
                        {step.status}
                      </p>
                      <p className="text-sm text-neutral-500">{step.date}</p>
                    </div>
                    {step.completed && (
                      <span className="text-[#D4AF37]">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Estimate */}
            <div className="border-t border-neutral-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  🚚
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Estimated Delivery</p>
                  <p className="text-neutral-600">{orderData.estimatedDelivery}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-neutral-100 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Order Items</h3>
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2">
                  <span className="text-neutral-600">{item.name} x {item.quantity}</span>
                  <span className="font-medium">₹{item.price.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <div className="border-t border-neutral-100 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Shipping Address</h3>
              <p className="text-neutral-600">
                {orderData?.shippingAddress?.name || "N/A"}<br />
                {orderData?.shippingAddress?.address || "N/A"}<br />
                {orderData?.shippingAddress?.city || "N/A"}, {orderData?.shippingAddress?.state || "N/A"}<br />
                {orderData?.shippingAddress?.pincode || "N/A"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Help Section */}
        {!orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-8"
          >
            <p className="text-neutral-600 mb-4">Need help with your order?</p>
            <Link
              to="/help-center"
              className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#B8962E] transition-colors"
            >
              Visit Help Center →
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
