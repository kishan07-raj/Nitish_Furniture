import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = "";

const AdminDashboard = () => {
  const { token, user, hasPermission } = useAuth();
  const [stats, setStats] = useState({
    products: { total: 0, lowStock: 0, outOfStock: 0, featured: 0 },
    orders: { total: 0, pending: 0, revenue: 0, today: 0, delivered: 0 },
    users: { total: 0, newThisMonth: 0, blocked: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState({ labels: [], data: [] });
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch products stats
      const productsRes = await fetch(`${API_BASE}/api/admin/products/stats`, { headers });
      const productsData = await productsRes.json();

      // Fetch orders stats
      const ordersRes = await fetch(`${API_BASE}/api/admin/orders/stats?period=${period}`, { headers });
      const ordersData = await ordersRes.json();

      // Fetch revenue data
      const revenueRes = await fetch(`${API_BASE}/api/admin/orders/revenue?groupBy=day`, { headers });
      const revenueDataRes = await revenueRes.json();

      // Fetch users stats
      const usersRes = await fetch(`${API_BASE}/api/admin/users/stats`, { headers });
      const usersData = await usersRes.json();

      // Fetch recent orders
      const recentOrdersRes = await fetch(`${API_BASE}/api/admin/orders?limit=8`, { headers });
      const recentOrdersData = await recentOrdersRes.json();

      if (productsData.success) {
        setStats(prev => ({
          ...prev,
          products: {
            total: productsData.stats.totalProducts || 0,
            lowStock: productsData.stats.lowStockProducts || 0,
            outOfStock: productsData.stats.outOfStock || 0,
            featured: productsData.stats.featuredProducts || 0
          }
        }));
      }

      if (ordersData.success) {
        setStats(prev => ({
          ...prev,
          orders: {
            total: ordersData.stats.totalOrders || 0,
            pending: ordersData.stats.pendingOrders || 0,
            revenue: ordersData.stats.totalRevenue || 0,
            today: ordersData.stats.todayOrders || 0,
            delivered: ordersData.stats.ordersByStatus?.delivered || 0
          }
        }));
      }

      if (revenueDataRes.success && revenueDataRes.revenue) {
        setRevenueData({
          labels: revenueDataRes.revenue.map(r => r._id || 'N/A'),
          data: revenueDataRes.revenue.map(r => r.revenue)
        });
      }

      if (usersData.success) {
        setStats(prev => ({
          ...prev,
          users: {
            total: usersData.stats.totalUsers || 0,
            newThisMonth: usersData.stats.newUsersThisMonth || 0,
            blocked: usersData.stats.blockedUsers || 0
          }
        }));
      }

      if (recentOrdersData.success) {
        setRecentOrders(recentOrdersData.orders || []);
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  // Revenue Chart Data
  const revenueChartData = {
    labels: revenueData.labels.length > 0 ? revenueData.labels : ['No Data'],
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.data.length > 0 ? revenueData.data : [0],
        fill: true,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { 
          color: '#64748b',
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  // Orders by status chart
  const ordersStatusData = {
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [
          stats.orders.pending || 1,
          stats.orders.total * 0.1 || 1,
          stats.orders.total * 0.1 || 1,
          stats.orders.delivered || 1,
          stats.orders.total * 0.05 || 1
        ],
        backgroundColor: [
          '#fbbf24',
          '#3b82f6',
          '#a855f7',
          '#22c55e',
          '#ef4444'
        ],
        borderWidth: 0
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, usePointStyle: true }
      }
    },
    cutout: '65%'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user?.name?.split(' ')[0]}! Here's what's happening.
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
          {['day', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p 
                  ? 'bg-amber-500 text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">Revenue</span>
            <span className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.orders.revenue)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            +12% from last {period}
          </p>
        </div>

        {/* Orders Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">Orders</span>
            <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.orders.total}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {stats.orders.today} orders today
          </p>
        </div>

        {/* Products Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">Products</span>
            <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.products.total}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {stats.products.lowStock} low stock
          </p>
        </div>

        {/* Users Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">Users</span>
            <span className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.users.total}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            +{stats.users.newThisMonth} this month
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Revenue Overview
          </h2>
          <div className="h-72">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Orders by Status
          </h2>
          <div className="h-56">
            <Doughnut data={ordersStatusData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        {stats.products.lowStock > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-400">Low Stock Alert</h3>
            </div>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              {stats.products.lowStock} products are running low on stock. 
              <a href="/admin/inventory" className="underline ml-1">View inventory →</a>
            </p>
          </div>
        )}

        {/* Out of Stock Alert */}
        {stats.products.outOfStock > 0 && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="font-semibold text-red-800 dark:text-red-400">Out of Stock</h3>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm">
              {stats.products.outOfStock} products are out of stock and need immediate attention.
              <a href="/admin/inventory" className="underline ml-1">Restock now →</a>
            </p>
          </div>
        )}

        {/* Pending Orders Alert */}
        {stats.orders.pending > 5 && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-400">Pending Orders</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              You have {stats.orders.pending} pending orders that need to be processed.
              <a href="/admin/orders" className="underline ml-1">View orders →</a>
            </p>
          </div>
        )}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Orders
          </h2>
          <a href="/admin/orders" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white">
                          {order.user?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {order.user?.email || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
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
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>No orders yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
