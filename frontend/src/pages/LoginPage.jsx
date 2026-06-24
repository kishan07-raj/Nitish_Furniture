// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (!password) return 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 5);
  };

  const validateRegisterForm = () => {
    const errors = {};

    if (!registerForm.name.trim()) {
      errors.name = "Full name is required.";
    } else if (registerForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!registerForm.email.trim()) {
      errors.email = "Email is required.";
    } else if (!validateEmail(registerForm.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!registerForm.password) {
      errors.password = "Password is required.";
    } else if (getPasswordStrength(registerForm.password) < 3) {
      errors.password =
        "Password must be 8+ characters with uppercase, lowercase, number or symbol.";
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!termsAccepted) {
      errors.terms = "You must accept the terms and conditions.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the login function from AuthContext with email and password
      const result = await login(loginForm.email.trim().toLowerCase(), loginForm.password);

      if (!result.success) {
        throw new Error(result.message || "Login failed");
      }

      // Navigate based on user role
      const role = result.user?.role;
      if (role === "admin" || role === "owner") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (!validateRegisterForm()) return;

    setLoading(true);

    try {
      const { confirmPassword, ...payload } = registerForm;

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Registration failed");
      }

      // After successful registration, login with the new credentials
      const loginResult = await login(
        registerForm.email.trim().toLowerCase(),
        registerForm.password
      );

      if (!loginResult.success) {
        setError("Registration successful, but login failed. Please try logging in manually.");
        return;
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleToSignUp = () => {
    setError("");
    setValidationErrors({});
    setIsSignUp(true);
  };

  const toggleToSignIn = () => {
    setError("");
      setValidationErrors({});
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4 pt-24">
      <div className="w-full max-w-4xl">
        {/* IMPORTANT: relative + fixed min height for sliding panels */}
        <div className="relative rounded-2xl shadow-xl bg-slate-900/60">
          {/* LOGIN SIDE (base layer) */}
          <div
            className={`transition-transform duration-300 ease-in-out ${
              isSignUp ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[520px]">
              {/* Left welcome (desktop only) */}
              <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-6 p-8 bg-gradient-to-br from-slate-800/60 to-slate-900/70">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-white">
                    Welcome Back
                  </h1>
                  <p className="text-lg text-slate-300 max-w-md">
                    Sign in to continue exploring premium furniture
                  </p>
                </div>
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Login form */}
              <div className="bg-white/10 backdrop-blur-lg border-l border-white/10 p-8 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Sign In
                  </h2>
                  <p className="text-slate-300">
                    Enter your credentials to access your account
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="login-email"
                        className="block text-sm font-medium text-slate-300 mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          id="login-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginForm.email}
                          onChange={handleLoginChange}
                          autoComplete="email"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                          required
                        />
                        <svg
                          className="absolute right-3 top-3.5 w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="login-password"
                        className="block text-sm font-medium text-slate-300 mb-2"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="login-password"
                          name="password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={handleLoginChange}
                          autoComplete="current-password"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                          required
                        />
                        <svg
                          className="absolute right-3 top-3.5 w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          className="text-sm text-amber-400 hover:text-orange-300 transition-colors"
                          onClick={() =>
                            alert("Forgot password functionality to be implemented")
                          }
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && !isSignUp && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading && !isSignUp ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Signing In...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-400">
                    Don't have an account?{" "}
                    <button
                      onClick={toggleToSignUp}
                      className="text-amber-400 hover:text-orange-300 font-medium transition-colors"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* REGISTER SIDE (slides over login) */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
              isSignUp ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[520px]">
              {/* Left welcome */}
              <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-6 p-8 bg-gradient-to-br from-slate-800/60 to-slate-900/70">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold text-white">Welcome!</h1>
                  <p className="text-lg text-slate-300 max-w-md">
                    Join our community and discover premium furniture for your home
                  </p>
                </div>
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Register form */}
              <div className="bg-white/10 backdrop-blur-lg border-l border-white/10 p-8 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Sign Up</h2>
                  <p className="text-slate-300">
                    Create your account to get started
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="register-name"
                        className="block text-sm font-medium text-slate-300 mb-2"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          id="register-name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={registerForm.name}
                          onChange={handleRegisterChange}
                          autoComplete="name"
                          className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            validationErrors.name
                              ? "border-red-400 bg-red-500/10 focus:ring-red-400"
                              : "border-white/20 focus:ring-amber-400"
                          }`}
                          required
                        />
                        <svg
                          className="absolute right-3 top-3.5 w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      {validationErrors.name && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="register-email"
                        className="block text-sm font-medium text-slate-300 mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          id="register-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          value={registerForm.email}
                          onChange={handleRegisterChange}
                          autoComplete="email"
                          className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            validationErrors.email
                              ? "border-red-400 bg-red-500/10 focus:ring-red-400"
                              : "border-white/20 focus:ring-amber-400"
                          }`}
                          required
                        />
                        <svg
                          className="absolute right-3 top-3.5 w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                      {validationErrors.email && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="register-password"
                        className="block text-sm font-medium text-slate-300 mb-2"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="register-password"
                          name="password"
                          type="password"
                          placeholder="Create a password"
                          value={registerForm.password}
                          onChange={handleRegisterChange}
                          autoComplete="new-password"
                          className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            validationErrors.password
                              ? "border-red-400 bg-red-500/10 focus:ring-red-400"
                              : "border-white/20 focus:ring-amber-400"
                          }`}
                          required
                        />
                        <svg
                          className="absolute right-3 top-3.5 w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      {registerForm.password && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 w-6 rounded ${
                                  level <=
                                  getPasswordStrength(registerForm.password)
                                    ? level === 1
                                      ? "bg-red-500"
                                      : level === 2
                                      ? "bg-orange-500"
                                      : level === 3
                                      ? "bg-yellow-500"
                                      : level === 4
                                      ? "bg-blue-500"
                                      : "bg-green-500"
                                    : "bg-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {getPasswordStrength(registerForm.password) < 3
                              ? "Weak password"
                              : getPasswordStrength(registerForm.password) < 4
                              ? "Medium password"
                              : "Strong password"}
                          </p>
                        </div>
                      )}
                      {validationErrors.password && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label
                        htmlFor="register-confirm-password"
                        className="block text-sm font-medium text-slate-300 mb-2"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="register-confirm-password"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={registerForm.confirmPassword}
                          onChange={handleRegisterChange}
                          autoComplete="new-password"
                          className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            validationErrors.confirmPassword
                              ? "border-red-400 bg-red-500/10 focus:ring-red-400"
                              : "border-white/20 focus:ring-amber-400"
                          }`}
                          required
                        />
                        <svg
                          className="absolute right-3 top-3.5 w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      {validationErrors.confirmPassword && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start mt-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 text-amber-400 mt-0.5 focus:ring-amber-400 border-slate-600 rounded"
                    />
                    <label
                      htmlFor="terms"
                      className="ml-2 block text-sm text-slate-300 cursor-pointer select-none"
                    >
                      I agree to the{" "}
                      <span className="text-amber-400 hover:text-orange-300 underline">
                        Terms and Conditions
                      </span>{" "}
                      and{" "}
                      <span className="text-amber-400 hover:text-orange-300 underline">
                        Privacy Policy
                      </span>
                    </label>
                  </div>
                  {validationErrors.terms && (
                    <p className="text-red-400 text-xs mt-1">
                      {validationErrors.terms}
                    </p>
                  )}

                  {error && isSignUp && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading && isSignUp ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating Account...
                      </div>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-400">
                    Already have an account?{" "}
                    <button
                      onClick={toggleToSignIn}
                      className="text-amber-400 hover:text-orange-300 font-medium transition-colors"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* END REGISTER SIDE */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
