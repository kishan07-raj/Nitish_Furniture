// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_BASE = "";

// Role hierarchy for frontend checks
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  DELIVERY_PARTNER: "deliveryPartner",
  CUSTOMER: "customer"
};

// Permission mapping for frontend
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
  
  // Products
  PRODUCTS_READ: "products:read",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",
  PRODUCTS_BULK: "products:bulk",
  
  // Orders
  ORDERS_READ: "orders:read",
  ORDERS_UPDATE: "orders:update",
  ORDERS_DELETE: "orders:delete",
  ORDERS_REFUND: "orders:refund",
  
  // Users
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  USERS_ROLES: "users:roles",
  
  // Inventory
  INVENTORY_READ: "inventory:read",
  INVENTORY_UPDATE: "inventory:update",
  
  // Finance
  FINANCE_READ: "finance:read",
  FINANCE_EXPORT: "finance:export",
  
  // CMS
  CMS_READ: "cms:read",
  CMS_CREATE: "cms:create",
  CMS_UPDATE: "cms:update",
  CMS_DELETE: "cms:delete",
  
  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",
  
  // Analytics & Audit
  ANALYTICS_VIEW: "analytics:view",
  AUDIT_READ: "audit:read",
  
  // Staff management (owner only)
  STAFF_MANAGE: "staff:manage",
  API_KEYS_MANAGE: "api_keys:manage",
  BACKUP_MANAGE: "backup:manage"
};

// Role-based permissions (for quick frontend checks)
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_DELETE, PERMISSIONS.PRODUCTS_BULK,
    PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_DELETE, PERMISSIONS.ORDERS_REFUND,
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.FINANCE_READ, PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.CMS_READ, PERMISSIONS.CMS_CREATE, PERMISSIONS.CMS_UPDATE, PERMISSIONS.CMS_DELETE,
    PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.AUDIT_READ, PERMISSIONS.ANALYTICS_VIEW
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.CMS_READ, PERMISSIONS.CMS_CREATE, PERMISSIONS.CMS_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.CMS_READ
  ],
  [ROLES.CUSTOMER]: []
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("nf_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("nf_token") || null;
  });

  const [permissions, setPermissions] = useState(() => {
    if (!user?.role) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  });

  const [loading, setLoading] = useState(true); // Start with true to validate token

  const isAuthenticated = !!token;

  // Validate token on mount - clear invalid/expired tokens
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          // Token is invalid or expired - clear auth data
          console.warn("Token validation failed, clearing auth data");
          setUser(null);
          setToken(null);
          setPermissions([]);
          localStorage.removeItem("nf_user");
          localStorage.removeItem("nf_token");
        } else {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            setPermissions(ROLE_PERMISSIONS[data.user.role] || []);
            localStorage.setItem("nf_user", JSON.stringify(data.user));
          } else {
            // Invalid response - clear auth data
            setUser(null);
            setToken(null);
            setPermissions([]);
            localStorage.removeItem("nf_user");
            localStorage.removeItem("nf_token");
          }
        }
      } catch (err) {
        console.error("Token validation error:", err);
        // Network error - keep user logged in, let them retry later
        // Don't clear token on network error to avoid logged out users being logged out on network issues
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  // Check if user has specific role
  const hasRole = (...roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  // Check if user is admin level (admin or owner)
  const isAdmin = hasRole(ROLES.OWNER, ROLES.ADMIN);
  
  // Check if user is manager or above
  const isManager = hasRole(ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER);
  
  // Check if user is owner only
  const isOwner = hasRole(ROLES.OWNER);

  // Check if user is delivery partner
  const isDeliveryPartner = hasRole(ROLES.DELIVERY_PARTNER);

  // Check specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Check multiple permissions (any)
  const hasAnyPermission = (...perms) => {
    return perms.some(p => permissions.includes(p));
  };

  // Check multiple permissions (all)
  const hasAllPermissions = (...perms) => {
    return perms.every(p => permissions.includes(p));
  };

  // Login function - accepts email and password
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      // Store user and token
      setUser(data.user);
      setToken(data.token);
      setPermissions(ROLE_PERMISSIONS[data.user.role] || []);

      localStorage.setItem("nf_user", JSON.stringify(data.user));
      localStorage.setItem("nf_token", data.token);

      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setToken(null);
      setPermissions([]);
      localStorage.removeItem("nf_user");
      localStorage.removeItem("nf_token");
    }
  };

  // Fetch fresh user data from server
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setPermissions(ROLE_PERMISSIONS[data.user.role] || []);
        localStorage.setItem("nf_user", JSON.stringify(data.user));
      }
    } catch (err) {
      console.error("Refresh user error:", err);
    }
  };

  // Update user in state and localStorage (for profile updates)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    setPermissions(ROLE_PERMISSIONS[updatedUser.role] || []);
    localStorage.setItem("nf_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        loading,
        isAuthenticated,
        hasRole,
        isAdmin,
        isManager,
        isOwner,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        login,
        logout,
        refreshUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

