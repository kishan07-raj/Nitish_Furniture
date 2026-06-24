import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";

const ProtectedRoute = ({ requiredRole, requiredPermission }) => {
  const { isAuthenticated, user, hasRole, hasPermission, hasAnyPermission, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while validating token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Check role requirement
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!hasRole(...allowedRoles)) {
      // Redirect to home if doesn't have required role
      return <Navigate to="/" replace />;
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    const requiredPerms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    if (!hasAnyPermission(...requiredPerms)) {
      // Redirect to admin dashboard if doesn't have required permission
      return <Navigate to="/admin" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

