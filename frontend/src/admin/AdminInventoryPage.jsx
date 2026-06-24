import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "";

const AdminInventoryPage = () => {
  const { token, hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, low, out
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockForm, setStockForm] = useState({ adjustment: 0, reason: "" });

  useEffect(() => {
    fetchInventory();
  }, [filter, search]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/admin/products?limit=100`;
      if (search) url += `&search=${search}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        let filtered = data.products || [];
        
        if (filter === "low") {
          filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
        } else if (filter === "out") {
          filtered = filtered.filter(p => p.stock <= 0);
        } else if (filter === "in") {
          filtered = filtered.filter(p => p.stock > 10);
        }
        
        setProducts(filtered);
      }
    } catch (err) {
      console.error("Inventory fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, adjustment) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}/stock`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          adjustment,
          reason: stockForm.reason 
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchInventory();
        setSelectedProduct(null);
        setStockForm({ adjustment: 0, reason: "" });
      }
    } catch (err) {
      console.error("Stock update error:", err);
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock <= 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock <= 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const inStock = products.filter(p => p.stock > 10).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage stock levels and track inventory</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Products</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">In Stock</p>
          <p className="text-2xl font-bold text-green-600">{inStock}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "in", "low", "out"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {f === "all" ? "All" : f === "in" ? "In Stock" : f === "low" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {products.length > 0 ? (
                  products.map((product) => {
                    const status = getStockStatus(product.stock);
                    return (
                      <tr key={product._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{product.sku || "N/A"}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{product.category}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${product.stock <= 0 ? 'text-red-600' : product.stock <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Adjust Stock</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedProduct.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Current Stock</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedProduct.stock}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adjustment (+/-)
                </label>
                <input
                  type="number"
                  value={stockForm.adjustment}
                  onChange={(e) => setStockForm({ ...stockForm, adjustment: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="e.g., 10 or -5"
                />
                <p className="text-xs text-slate-500 mt-1">
                  New stock: {selectedProduct.stock + stockForm.adjustment}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason (optional)
                </label>
                <select
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">Select reason</option>
                  <option value="restock">Restock</option>
                  <option value="sale">Sale</option>
                  <option value="return">Return</option>
                  <option value="damaged">Damaged</option>
                  <option value="adjustment">Inventory Adjustment</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => { setSelectedProduct(null); setStockForm({ adjustment: 0, reason: "" }); }}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStock(selectedProduct._id, stockForm.adjustment)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryPage;
