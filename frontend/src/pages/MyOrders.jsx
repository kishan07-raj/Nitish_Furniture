import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

function MyOrders() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const API_BASE = "";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate, token, pagination.page, statusFilter, sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy
      });
      
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      
      // Use /api/orders/my endpoint (primary)
      const res = await fetch(`${API_BASE}/api/orders/my?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await res.json();
      
      if (data.success && data.orders) {
        setOrders(data.orders || []);
        setPagination(prev => ({
          ...prev,
          ...data.pagination
        }));
      } else {
        setError(data.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      returned: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600",
      paid: "text-green-600",
      failed: "text-red-600",
      refunded: "text-orange-600"
    };
    return colors[status] || "text-gray-600";
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <Link to="/stores" className="text-amber-700 hover:text-amber-800 text-sm font-medium">
            Continue Shopping →
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search Order ID</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter order ID..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="w-40">
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            
            {/* Sort */}
            <div className="w-40">
              <label className="block text-xs font-medium text-slate-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
              </select>
            </div>
            
            {/* Search Button */}
            <button
              type="submit"
              className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
            <button onClick={fetchOrders} className="ml-2 underline font-medium">
              Try again
            </button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4v10l8 4m0-10l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-600 mb-6">
              {searchQuery || statusFilter 
                ? "Try adjusting your filters" 
                : "You haven't placed any orders yet."}
            </p>
            <Link 
              to="/stores" 
              className="inline-block bg-amber-800 text-white px-6 py-3 rounded-full font-medium hover:bg-amber-900 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order) => (
                <div 
                  key={order._id} 
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Order ID</p>
                          <p className="font-mono font-semibold text-slate-900">
                            {order.orderId || order._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Order Date</p>
                        <p className="text-slate-700">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                        <p className="font-semibold text-slate-900">₹{order.grandTotal?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 overflow-x-auto flex-1">
                        {order.items?.slice(0, 4).map((item, index) => (
                          <div key={index} className="flex items-center gap-3 min-w-fit">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-14 h-14 rounded-lg object-cover bg-slate-100"
                              />
                            )}
                            {!item.image && (
                              <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                                <span className="text-xs text-slate-400">No Img</span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">
                                {item.name || "Unknown Product"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Qty: {item.quantity || 1} × ₹{item.pricePerUnit?.toLocaleString() || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items?.length > 4 && (
                          <span className="text-xs text-slate-500 font-medium">
                            +{order.items.length - 4} more items
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/orders/${order._id}`}
                          className="px-4 py-2 border border-amber-800 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                        {order.estimatedDelivery && !order.isCancelled && order.status !== "delivered" && (
                          <p>
                            Estimated Delivery:{" "}
                            <span className="text-green-600 font-medium">
                              {formatDate(order.estimatedDelivery)}
                            </span>
                          </p>
                        )}
                        {order.trackingId && order.status === "shipped" && (
                          <p>
                            Tracking ID:{" "}
                            <span className="text-purple-600 font-mono font-medium">
                              {order.trackingId}
                            </span>
                          </p>
                        )}
                        <p>
                          Payment: <span className="font-medium text-slate-700">{order.paymentMethod || "COD"}</span>
                        </p>
                        <p>
                          Status: <span className={`font-medium capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus || "pending"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium ${
                          pagination.page === pageNum
                            ? "bg-amber-800 text-white"
                            : "border border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            )}
            
            {/* Results Info */}
            <div className="mt-4 text-center text-xs text-slate-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyOrders;

