import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { isOwner } from "../utils/roleUtils";
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
  Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend
);

const API_BASE = "";

const AdminFinancePage = () => {
  const { token, user: currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    pendingPayments: 0,
    refundedAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [revenueData, setRevenueData] = useState({ labels: [], data: [] });
  const [categoryData, setCategoryData] = useState({ labels: [], data: [] });

  useEffect(() => {
    fetchFinanceData();
  }, [period]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Get order stats
      const ordersRes = await fetch(`${API_BASE}/api/admin/orders/stats?period=${period}`, { headers });
      const ordersData = await ordersRes.json();

      // Get revenue data
      const revenueRes = await fetch(`${API_BASE}/api/admin/orders/revenue?groupBy=day&period=${period}`, { headers });
      const revenueDataRes = await revenueRes.json();

      // Get sales by category
      const categoryRes = await fetch(`${API_BASE}/api/admin/analytics/sales-by-category?period=${period}`, { headers });
      const categoryDataRes = await categoryRes.json();

      if (ordersData.success) {
        setStats({
          totalRevenue: ordersData.stats.totalRevenue || 0,
          monthlyRevenue: ordersData.stats.totalRevenue || 0,
          averageOrderValue: ordersData.stats.totalOrders > 0 
            ? (ordersData.stats.totalRevenue / ordersData.stats.totalOrders).toFixed(2) 
            : 0,
          totalOrders: ordersData.stats.totalOrders || 0,
          pendingPayments: ordersData.stats.pendingOrders * 5000,
          refundedAmount: 0
        });
      }

      if (revenueDataRes.success && revenueDataRes.revenue) {
        setRevenueData({
          labels: revenueDataRes.revenue.map(r => r._id || 'N/A'),
          data: revenueDataRes.revenue.map(r => r.revenue)
        });
      }

      if (categoryDataRes.success && categoryDataRes.data) {
        setCategoryData({
          labels: categoryDataRes.data.map(d => d._id || 'Other'),
          data: categoryDataRes.data.map(d => d.revenue)
        });
      }
    } catch (err) {
      console.error("Finance fetch error:", err);
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

  const revenueChartData = {
    labels: revenueData.labels.length > 0 ? revenueData.labels : ['No Data'],
    datasets: [{
      label: 'Revenue',
      data: revenueData.data.length > 0 ? revenueData.data : [0],
      fill: true,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
      y: { 
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#64748b', callback: (v) => formatCurrency(v) }
      }
    }
  };

  const categoryColors = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#14b8a6', '#f97316'];
  const categoryChartData = {
    labels: categoryData.labels.length > 0 ? categoryData.labels : ['No Data'],
    datasets: [{
      data: categoryData.data.length > 0 ? categoryData.data : [1],
      backgroundColor: categoryColors,
      borderWidth: 0
    }]
  };

  // FIXED: Use isOwner function properly with currentUser parameter
  if (!isOwner(currentUser)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Only the owner can view financial data.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Revenue analytics and financial reports</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Order Value</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(stats.averageOrderValue)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pending Payments</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{formatCurrency(stats.pendingPayments)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue Over Time</h2>
          <div className="h-80">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue by Category</h2>
          <div className="h-64">
            <Pie data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } } } }} />
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Export Reports</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancePage;

