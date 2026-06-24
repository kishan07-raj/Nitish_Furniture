import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isOwner } from "../utils/roleUtils";

const API_BASE = "";

const AdminSettingsPage = () => {
  const { token, user: currentUser } = useAuth();
  const [settings, setSettings] = useState({
    siteName: "Nitish Furniture House",
    siteEmail: "contact@nitishfurniture.com",
    sitePhone: "+91 6200694677",
    currency: "INR",
    timezone: "Asia/Kolkata",
    taxRate: 18,
    shippingCost: 500,
    freeShippingThreshold: 10000,
    lowStockThreshold: 10,
    orderEmailNotification: true,
    lowStockAlert: true,
    maintenanceMode: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate save - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Use isOwner function properly with currentUser parameter
  if (!isOwner(currentUser)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Only the owner can access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your store settings</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">General Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Support Email</label>
            <input
              type="email"
              value={settings.siteEmail}
              onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Support Phone</label>
            <input
              type="text"
              value={settings.sitePhone}
              onChange={(e) => setSettings({ ...settings, sitePhone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Business Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shipping Cost (₹)</label>
            <input
              type="number"
              value={settings.shippingCost}
              onChange={(e) => setSettings({ ...settings, shippingCost: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Free Shipping Threshold (₹)</label>
            <input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Low Stock Alert Threshold</label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Order Email Notifications</p>
              <p className="text-sm text-slate-500">Receive email when new orders are placed</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, orderEmailNotification: !settings.orderEmailNotification })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.orderEmailNotification ? 'bg-amber-500' : 'bg-slate-300'}`}
            >
              <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings.orderEmailNotification ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Low Stock Alerts</p>
              <p className="text-sm text-slate-500">Receive alerts when products are running low</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, lowStockAlert: !settings.lowStockAlert })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.lowStockAlert ? 'bg-amber-500' : 'bg-slate-300'}`}
            >
              <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings.lowStockAlert ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Maintenance Mode</p>
              <p className="text-sm text-slate-500">Put the site in maintenance mode</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
            >
              <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${settings.maintenanceMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
