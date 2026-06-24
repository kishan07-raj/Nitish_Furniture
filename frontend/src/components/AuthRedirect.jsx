import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthRedirect = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    // Redirect authenticated users to home or admin dashboard based on role
    const redirectPath = user?.role === "admin" ? "/admin" : "/";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default AuthRedirect;
