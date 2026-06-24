import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = "";

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await axios.get(`/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.error("Failed to load order", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, token]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    setCancelling(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.put(`/orders/${id}/cancel`, 
        { reason: "Cancelled by customer" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess("Order cancelled successfully!");
        setOrder(res.data.order);
      } else {
        setError(res.data.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      setError(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnRequest = async () => {
    const reason = window.prompt("Please enter the reason for return:");
    if (!reason) return;

    try {
      const res = await axios.put(`/orders/${id}/return`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess("Return request submitted successfully!");
        setOrder(res.data.order);
      } else {
        setError(res.data.message || "Failed to submit return request");
      }
    } catch (err) {
      console.error("Return request error:", err);
      setError(err.response?.data?.message || "Failed to submit return request");
    }
  };

  // Check if order can be cancelled (pending or confirmed only)
  const canCancel = order && !order.isCancelled && ["pending", "confirmed"].includes(order.status);
  
  // Check if return is allowed (delivered within 7 days)
  const canReturn = order && order.status === "delivered" && order.deliveredAt && 
    (Date.now() - new Date(order.deliveredAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  // Order timeline steps
  const getOrderTimeline = () => {
    if (!order) return [];
    
    const steps = [
      { key: "placed", label: "Order Placed", date: order.createdAt, completed: true },
      { key: "confirmed", label: "Confirmed", date: order.status !== "pending" ? order.updatedAt : null, completed: ["confirmed", "processing", "shipped", "delivered"].includes(order.status) },
      { key: "processing", label: "Processing", date: order.status === "processing" || ["shipped", "delivered"].includes(order.status) ? order.updatedAt : null, completed: ["processing", "shipped", "delivered"].includes(order.status) },
      { key: "shipped", label: "Shipped", date: order.trackingId ? order.updatedAt : null, completed: ["shipped", "delivered"].includes(order.status) },
      { key: "delivered", label: "Delivered", date: order.deliveredAt, completed: order.status === "delivered" }
    ];

    // If cancelled
    if (order.isCancelled) {
      return [
        { key: "placed", label: "Order Placed", date: order.createdAt, completed: true },
        { key: "cancelled", label: "Cancelled", date: order.cancelledAt, completed: true, cancelled: true }
      ];
    }

    // If returned
    if (order.isReturned) {
      return [
        { key: "placed", label: "Order Placed", date: order.createdAt, completed: true },
        { key: "delivered", label: "Delivered", date: order.deliveredAt, completed: true },
        { key: "returned", label: "Returned", date: order.returnedAt, completed: true, returned: true }
      ];
    }

    return steps;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-indigo-100 text-indigo-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-orange-100 text-orange-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-slate-600">Order not found.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-50 hover:bg-black/90"
        >
          Back to home
        </button>
      </div>
    );
  }

  const timeline = getOrderTimeline();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusColor(order.status)}`}>
            <span className={`h-2 w-2 rounded-full ${
              order.isCancelled ? "bg-red-500" : 
              order.isReturned ? "bg-orange-500" : 
              "bg-green-500"
            }`} />
            {order.isCancelled ? "Order Cancelled" : 
             order.isReturned ? "Order Returned" : 
             `Order ${order.status}`}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Order #{order.orderId || order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex gap-3">
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
          {canReturn && (
            <button
              onClick={handleReturnRequest}
              className="rounded-full border border-orange-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 hover:bg-orange-50"
            >
              Request Return
            </button>
          )}
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Timeline</h2>
        <div className="flex items-center justify-between">
          {timeline.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? step.cancelled 
                      ? "bg-red-100 text-red-600" 
                      : step.returned 
                        ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      {step.cancelled ? (
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      ) : step.returned ? (
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </svg>
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <p className={`mt-2 text-xs font-medium ${step.completed ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[10px] text-slate-500">{formatDate(step.date)}</p>
                )}
              </div>
              {index < timeline.length - 1 && (
                <div className={`w-16 md:w-24 h-0.5 mx-2 ${step.completed ? "bg-green-200" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tracking Info */}
      {order.trackingId && !order.isCancelled && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🚚 Shipping Information</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Tracking ID</p>
              <p className="font-mono font-semibold text-purple-600">{order.trackingId}</p>
            </div>
            {order.estimatedDelivery && (
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Estimated Delivery</p>
                <p className="font-semibold text-green-600">{formatDate(order.estimatedDelivery)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[2fr,1.2fr]">
        {/* Items */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Items in this order ({order.items?.length})</h2>
          {order.items?.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
            >
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover bg-white"
                />
              )}
              {!item.image && (
                <div className="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center">
                  <span className="text-xs text-slate-400">No Image</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">{item.name}</h3>
                <div className="text-sm text-slate-500 mt-1">
                  {item.selectedWood && <span>Wood: {item.selectedWood}</span>}
                  {item.selectedWood && item.selectedSize && <span> | </span>}
                  {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  Qty: {item.quantity} × ₹{item.pricePerUnit?.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  ₹{((item.pricePerUnit || 0) * (item.quantity || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold mb-4">📍 Shipping Address</h2>
            <div className="text-sm text-slate-700">
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p className="text-slate-500">{order.shippingAddress?.phone}</p>
              <p className="mt-2">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
              {order.shippingAddress?.landmark && <p>Landmark: {order.shippingAddress.landmark}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
              <p>{order.shippingAddress?.country}</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold mb-4">💳 Payment Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-900">₹{order.itemsTotal?.toLocaleString() || 0}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax (GST 18%)</span>
                  <span className="text-slate-900">₹{order.tax?.toLocaleString() || 0}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="text-slate-900">
                  {order.shippingCharge > 0 ? `₹${order.shippingCharge.toLocaleString()}` : "Free"}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-amber-800">₹{order.grandTotal?.toLocaleString() || 0}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Payment Method</span>
                <span className="font-medium text-slate-900">
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600">Payment Status</span>
                <span className={`font-medium capitalize ${
                  order.paymentStatus === "paid" ? "text-green-600" : 
                  order.paymentStatus === "failed" ? "text-red-600" : "text-yellow-600"
                }`}>
                  {order.paymentStatus || "pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.cancellationReason && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h2 className="text-lg font-semibold mb-2 text-red-800">⚠️ Cancellation Info</h2>
              <p className="text-sm text-red-700">{order.cancellationReason}</p>
              {order.cancelledAt && (
                <p className="text-xs text-red-500 mt-2">Cancelled on {formatDateTime(order.cancelledAt)}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/"
          className="rounded-full bg-amber-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-amber-50 hover:bg-black/90"
        >
          Continue Shopping
        </Link>
        <Link
          to="/orders"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50"
        >
          View All Orders
        </Link>
      </div>
    </div>
  );
}

export default OrderDetails;

