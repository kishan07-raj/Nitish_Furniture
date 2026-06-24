import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const API_BASE = "";

function Profile() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  
  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Address state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "", phone: "", street: "", landmark: "", city: "", state: "", postalCode: "", country: "India", addressType: "Home", isDefault: false
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Orders state for profile tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  });

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
      return;
    }
    fetchProfileData();
    fetchWishlist();
  }, [user, token, navigate]);

  const fetchProfileData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setProfileData(data.user);
        setProfileForm({
          name: data.user.name || "",
          phone: data.user.phone || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/wishlist`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setWishlist(data.wishlist || []);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(profileForm)
      });
      
      const data = await res.json();
      if (data.success) {
        setProfileData({ ...profileData, ...data.user });
        setEditingProfile(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setSavingPassword(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/users/password`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setChangingPassword(false);
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    
    try {
      const url = editingAddress 
        ? `${API_BASE}/api/users/address/${editingAddress}`
        : `${API_BASE}/api/users/address`;
      
      const res = await fetch(url, {
        method: editingAddress ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(addressForm)
      });
      
      const data = await res.json();
      if (data.success) {
        setProfileData({ ...profileData, addresses: data.addresses });
        resetAddressForm();
        toast.success(editingAddress ? "Address updated" : "Address added");
      } else {
        toast.error(data.message || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/users/address/${addressId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      
      const data = await res.json();
      if (data.success) {
        setProfileData({ ...profileData, addresses: data.addresses });
        toast.success("Address deleted");
      } else {
        toast.error(data.message || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/address/${addressId}/default`, {
        method: "PUT",
        headers: getAuthHeaders()
      });
      
      const data = await res.json();
      if (data.success) {
        setProfileData({ ...profileData, addresses: data.addresses });
        toast.success("Default address updated");
      } else {
        toast.error(data.message || "Failed to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to set default address");
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/wishlist/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      
      const data = await res.json();
      if (data.success) {
        setWishlist(wishlist.filter(item => item._id !== productId));
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      fullName: "", phone: "", street: "", landmark: "", city: "", state: "", postalCode: "", country: "India", addressType: "Home", isDefault: false
    });
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const openEditAddress = (address) => {
    setAddressForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      street: address.street || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      addressType: address.addressType || "Home",
      isDefault: address.isDefault || false
    });
    setEditingAddress(address._id);
    setShowAddressForm(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  // Fetch orders for profile tab - must be defined BEFORE early return to maintain hook consistency
  const fetchOrders = async () => {
    if (activeTab !== "orders") return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/orders?limit=5`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Overview", icon: "👤" },
    { key: "orders", label: "My Orders", icon: "📦" },
    { key: "addresses", label: "Addresses", icon: "📍" },
    { key: "wishlist", label: "Wishlist", icon: "❤️" },
    { key: "security", label: "Security", icon: "🔒" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
          <p className="mt-2 text-slate-600">Manage your profile, addresses, and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-amber-800 text-amber-800"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.key === "wishlist" && wishlist.length > 0 && (
                    <span className="ml-1 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="text-amber-700 hover:text-amber-800 font-medium text-sm"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <form onSubmit={handleProfileSave} className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={profileData?.email || ""}
                        disabled
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900 disabled:opacity-50"
                      >
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileForm({ name: profileData?.name || "", phone: profileData?.phone || "" });
                        }}
                        className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                        <p className="text-slate-900 font-medium">{profileData?.name || "Not provided"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</label>
                        <p className="text-slate-900 font-medium">{profileData?.email}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</label>
                        <p className="text-slate-900 font-medium">{profileData?.phone || "Not provided"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Account Type</label>
                        <p className="text-slate-900 font-medium capitalize">{profileData?.role || "Customer"}</p>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                        <p className="text-xs text-amber-700 uppercase tracking-wide">Loyalty Points</p>
                        <p className="text-2xl font-bold text-amber-800">{profileData?.loyaltyPoints || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                        <p className="text-xs text-green-700 uppercase tracking-wide">Total Orders</p>
                        <p className="text-2xl font-bold text-green-800">{profileData?.orderStats?.totalOrders || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <p className="text-xs text-blue-700 uppercase tracking-wide">Delivered</p>
                        <p className="text-2xl font-bold text-blue-800">{profileData?.orderStats?.deliveredOrders || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <p className="text-xs text-purple-700 uppercase tracking-wide">Total Spent</p>
                        <p className="text-2xl font-bold text-purple-800">₹{(profileData?.totalSpent || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Saved Addresses</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-amber-800 text-white px-4 py-2 rounded-lg hover:bg-amber-900 text-sm font-medium"
                    >
                      + Add New Address
                    </button>
                  )}
                </div>

                {showAddressForm && (
                  <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingAddress ? "Edit Address" : "Add New Address"}
                    </h3>
                    <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Landmark</label>
                        <input
                          type="text"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code *</label>
                        <input
                          type="text"
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address Type</label>
                        <select
                          value={addressForm.addressType}
                          onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="w-4 h-4 text-amber-800 rounded focus:ring-amber-400"
                          />
                          <span className="text-sm text-slate-700">Set as default address</span>
                        </label>
                      </div>
                      <div className="md:col-span-2 flex gap-3">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900 disabled:opacity-50"
                        >
                          {savingAddress ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
                        </button>
                        <button
                          type="button"
                          onClick={resetAddressForm}
                          className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {!profileData?.addresses || profileData.addresses.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <div className="text-4xl mb-3">📍</div>
                    <p className="text-slate-600 mb-4">No addresses saved yet</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-amber-700 hover:text-amber-800 font-medium"
                    >
                      Add your first address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileData.addresses.map((address) => (
                      <div key={address._id} className={`p-5 rounded-xl border-2 ${address.isDefault ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            {address.isDefault && (
                              <span className="inline-block bg-amber-200 text-amber-800 text-xs font-medium px-2 py-1 rounded-full mb-2">
                                Default
                              </span>
                            )}
                            <span className="inline-block bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full ml-2">
                              {address.addressType || "Home"}
                            </span>
                            <h3 className="font-semibold text-slate-900 mt-2">{address.fullName}</h3>
                            <p className="text-sm text-slate-600">{address.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditAddress(address)}
                              className="text-amber-700 hover:text-amber-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">
                          {address.street}{address.landmark && `, ${address.landmark}`}<br />
                          {address.city}, {address.state} - {address.postalCode}<br />
                          {address.country}
                        </p>
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="mt-3 text-sm text-amber-700 hover:text-amber-800 font-medium"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">My Wishlist</h2>
                  <Link to="/stores" className="text-amber-700 hover:text-amber-800 font-medium text-sm">
                    Continue Shopping →
                  </Link>
                </div>

                {wishlist.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <div className="text-4xl mb-3">❤️</div>
                    <p className="text-slate-600 mb-4">Your wishlist is empty</p>
                    <Link to="/stores" className="text-amber-700 hover:text-amber-800 font-medium">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wishlist.map((product) => (
                      <div key={product._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                          src={product.images?.[0] || "/assets/no-image.png"}
                          alt={product.name}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-medium text-slate-900 truncate">{product.name}</h3>
                          <p className="text-amber-800 font-bold mt-1">₹{product.basePrice?.toLocaleString() || 0}</p>
                          <div className="flex gap-2 mt-3">
                            <Link
                              to={`/product/${product.slug}`}
                              className="flex-1 text-center bg-amber-800 text-white py-2 rounded-lg text-sm hover:bg-amber-900"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleRemoveFromWishlist(product._id)}
                              className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Security Settings</h2>
                
                {/* Change Password */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  
                  {!changingPassword ? (
                    <button
                      onClick={() => setChangingPassword(true)}
                      className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900"
                    >
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                          required
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={savingPassword}
                          className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900 disabled:opacity-50"
                        >
                          {savingPassword ? "Changing..." : "Change Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChangingPassword(false);
                            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                          }}
                          className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Account Info */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Email:</span> {profileData?.email}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Member since:</span> {formatDate(profileData?.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={logout}
                    className="bg-red-50 text-red-600 px-6 py-3 rounded-lg hover:bg-red-100 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

