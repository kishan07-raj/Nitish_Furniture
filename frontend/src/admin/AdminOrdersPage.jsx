import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "";

const AdminOrdersPage = () => {
  const { token, hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search })
      });
      
      const res = await fetch(`${API_BASE}/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      console.error("Admin orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">All Status</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr 
                        key={order._id} 
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer ${selectedOrder?._id === order._id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900 dark:text-white">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-900 dark:text-white">{order.user?.name || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{order.user?.email || ''}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {formatCurrency(order.grandTotal)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {selectedOrder ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Order #{selectedOrder._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Customer</h4>
                <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.user?.name}</p>
                <p className="text-sm text-slate-500">{selectedOrder.user?.email}</p>
                <p className="text-sm text-slate-500">{selectedOrder.user?.phone || 'No phone'}</p>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Shipping Address</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {selectedOrder.shippingAddress || 'No address provided'}
                </p>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.product?.name || 'Product'} × {item.quantity}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.pricePerUnit * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between font-medium">
                  <span className="text-slate-900 dark:text-white">Total</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Update Status</h4>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Payment Info */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Payment Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  selectedOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
