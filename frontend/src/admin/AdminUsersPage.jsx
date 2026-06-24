import { useState, useEffect } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import { isOwner } from "../utils/roleUtils";

const API_BASE = "";

const AdminUsersPage = () => {
  const { token, user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ role: "", isBlocked: false });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(roleFilter && { role: roleFilter }),
        ...(search && { search })
      });
      
      const res = await fetch(`${API_BASE}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      console.error("Admin users fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          role: roleFormData.role,
          isBlocked: roleFormData.isBlocked
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error("Role update error:", err);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        if (selectedUser?._id === userId) {
          setSelectedUser(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setRoleFormData({
      role: user.role,
      isBlocked: user.isBlocked || false
    });
    setShowModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'staff': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  const roles = ['customer', 'staff', 'manager', 'admin', 'owner'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage customer and staff accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">All Roles</option>
          {roles.map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr 
                        key={user._id} 
                        onClick={() => setSelectedUser(user)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer ${selectedUser?._id === user._id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.isBlocked ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Blocked</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {(isOwner(currentUser) || hasPermission("users:update")) && user._id !== currentUser?._id && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); openRoleModal(user); }}
                                className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-100 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {isOwner(currentUser) && user._id !== currentUser?._id && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteUser(user._id); }}
                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No users found
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

        {/* User Details Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {selectedUser ? (
            <div className="space-y-6">
              {/* Profile */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-amber-600 dark:text-amber-400 font-bold">
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Role</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedUser.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Phone</span>
                  <span className="text-sm text-slate-900 dark:text-white">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Joined</span>
                  <span className="text-sm text-slate-900 dark:text-white">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {selectedUser.totalSpent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Total Spent</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      ₹{selectedUser.totalSpent?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {selectedUser._id !== currentUser?._id && (isOwner(currentUser) || hasPermission("users:update")) && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => openRoleModal(selectedUser)}
                    className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Edit User
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Update Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit User Role</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedUser.email}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                <select
                  value={roleFormData.role}
                  onChange={(e) => setRoleFormData({ ...roleFormData, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {roles.map(r => (
                    <option key={r} value={r} disabled={r === 'owner' && !isOwner(currentUser)}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isBlocked"
                  checked={roleFormData.isBlocked}
                  onChange={(e) => setRoleFormData({ ...roleFormData, isBlocked: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="isBlocked" className="text-sm text-slate-700 dark:text-slate-300">Block User</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateUserRole(selectedUser._id)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
