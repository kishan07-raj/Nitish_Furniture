// Role utility functions for safe role checking
// Use these instead of calling undefined functions

/**
 * Check if user has owner role
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user is owner
 */
export const isOwner = (user) => user?.role === "owner";

/**
 * Check if user has admin role
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => user?.role === "admin";

/**
 * Check if user has manager role
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user is manager
 */
export const isManager = (user) => user?.role === "manager";

/**
 * Check if user has staff role
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user is staff
 */
export const isStaff = (user) => user?.role === "staff";

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object from AuthContext
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} - True if user has any of the roles
 */
export const hasAnyRole = (user, roles) => {
  if (!user?.role) return false;
  return roles.includes(user.role);
};

/**
 * Check if user has admin-level access (owner or admin)
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user is owner or admin
 */
export const isAdminLevel = (user) => {
  return isOwner(user) || isAdmin(user);
};

/**
 * Check if user has manager-level access (owner, admin, or manager)
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user is owner, admin, or manager
 */
export const isManagerLevel = (user) => {
  return isOwner(user) || isAdmin(user) || isManager(user);
};

export default {
  isOwner,
  isAdmin,
  isManager,
  isStaff,
  hasAnyRole,
  isAdminLevel,
  isManagerLevel
};

