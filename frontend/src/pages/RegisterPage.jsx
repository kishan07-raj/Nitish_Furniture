import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      return setError("All fields are required");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      await axios.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Premium WoodenStreet-style Register Page */
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4 py-12 pt-24">

      {/* Elegant Centered Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl border border-amber-200/50 shadow-2xl p-8 sm:p-10 hover:shadow-3xl transition-shadow duration-300">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-serif">
            Join Us
          </h2>
          <p className="text-sm text-amber-700 font-medium">
            Create your premium account
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <Input
            label="Full Name"
            icon={User}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />

          <Input
            label="Email Address"
            icon={Mail}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />

          <PasswordInput
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            show={showPass}
            toggle={() => setShowPass(!showPass)}
            placeholder="Create a password"
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            show={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
            placeholder="Confirm your password"
          />

          {/* Terms Agreement */}
          <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer group">
            <input
              type="checkbox"
              required
              className="mt-1 w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
            />
            <span className="leading-relaxed">
              I agree to the{" "}
              <span className="text-amber-700 font-medium hover:text-amber-800 underline decoration-amber-300">
                Terms & Conditions
              </span>{" "}
              and{" "}
              <span className="text-amber-700 font-medium hover:text-amber-800 underline decoration-amber-300">
                Privacy Policy
              </span>
            </span>
          </label>

          {/* Premium Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg hover:from-amber-700 hover:to-orange-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-amber-700 font-semibold hover:text-amber-800 underline decoration-amber-300 hover:decoration-amber-400 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Input({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-2">
        <Icon className="absolute left-4 top-3.5 h-4 w-4 text-amber-500" />
        <input
          {...props}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:bg-white hover:shadow-sm"
        />
      </div>
    </div>
  );
}

function PasswordInput({ label, show, toggle, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-2">
        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-amber-500" />
        <input
          {...props}
          type={show ? "text" : "password"}
          className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:bg-white hover:shadow-sm"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-4 top-3.5 text-gray-400 hover:text-amber-600 transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
