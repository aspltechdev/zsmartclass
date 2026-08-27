import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return alert("Please enter email and password.");
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", form);

      console.log("Login response:", res.data);

      // Pass the entire response data to login function
      // AuthContext will handle token and user extraction
      login(res.data, rememberMe);

      // Get user data for navigation
      const userData = res.data.user || res.data;

      // Role-based navigation
      switch (userData.role) {
        case "ADMIN":
          navigate("/admin/dashboard", { replace: true });
          break;

        case "MENTOR":
          navigate("/mentor/dashboard", { replace: true });
          break;

        case "STUDENT":
          navigate("/student/dashboard", { replace: true });
          break;

        default:
          navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);

      alert(
        err.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Background Decorative Elements */}
      <div className="login-bg-decoration">
        <div className="login-bg-pattern" />
        <div className="login-bg-glow-1" />
        <div className="login-bg-glow-2" />
        <div className="login-bg-line-1" />
        <div className="login-bg-line-2" />
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="login-container"
      >
        <div className="login-top-stripe" />

        <div className="login-grid">
          {/* ============================================
              LEFT - BRANDING SECTION
              ============================================ */}
          <div className="login-branding">
            <div className="login-branding-pattern" />
            <div className="login-branding-stripe" />

            <div className="login-corner-tl" />
            <div className="login-corner-tr" />
            <div className="login-corner-bl" />
            <div className="login-corner-br" />

            <div className="login-branding-content">
              {/* Logo Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                }}
                className="login-logo-badge"
              >
                <div className="login-logo-icon">
                  <span className="login-logo-text">ZC</span>
                </div>

                <div className="login-logo-label">
                  <span className="login-logo-title">
                    ZsmartClass
                  </span>

                  <span className="login-logo-subtitle">
                    Learning Management System
                  </span>
                </div>
              </motion.div>

              {/* Main Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                }}
                className="login-branding-main"
              >
                <h1 className="login-branding-heading">
                  Learn.
                  <br />
                  <span className="login-branding-highlight">
                    Grow.
                  </span>
                  <br />
                  <span className="login-branding-highlight">
                    Succeed.
                  </span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5,
                }}
                className="login-branding-tagline"
              >
                Your Gateway to Knowledge & Personal Growth
              </motion.p>

              {/* Quote */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.6,
                }}
                className="login-branding-quote-wrapper"
              >
                <blockquote className="login-branding-quote">
                  "Education is the most powerful weapon which you can use
                  to change the world."
                </blockquote>

                <cite className="login-branding-cite">
                  — Nelson Mandela
                </cite>
              </motion.div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.8,
              }}
              className="login-branding-stats"
            >
              {[
                {
                  label: "Courses",
                  value: "100+",
                },
                {
                  label: "Students",
                  value: "5K+",
                },
                {
                  label: "Experts",
                  value: "50+",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="login-stat-item"
                >
                  <div className="login-stat-value">
                    {item.value}
                  </div>

                  <div className="login-stat-label">
                    {item.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ============================================
              RIGHT - LOGIN FORM SECTION
              ============================================ */}
          <div className="login-form-wrapper">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
              }}
              className="login-form-inner"
            >
              {/* Welcome Message */}
              <div className="login-welcome">
                <h2 className="login-welcome-title">
                  Welcome Back!
                </h2>

                <p className="login-welcome-subtitle">
                  Sign in to continue your learning journey
                </p>

                <div className="login-welcome-line" />
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="login-form"
              >
                {/* Email */}
                <div className="login-field-group">
                  <label
                    htmlFor="email"
                    className="login-field-label"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    className="login-field-input"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password */}
                <div className="login-field-group">
                  <label
                    htmlFor="password"
                    className="login-field-label"
                  >
                    Password
                  </label>

                  <div className="login-password-wrapper">
                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      className="login-field-input login-password-input"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />

                    {/* Show eye only when password has content */}
                    {form.password.length > 0 && (
                      <button
                        type="button"
                        className="login-password-toggle"
                        onClick={() =>
                          setShowPassword(
                            (prev) => !prev
                          )
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        title={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="login-options">
                  <label className="login-checkbox-label">
                    <input
                      type="checkbox"
                      className="login-checkbox"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(
                          e.target.checked
                        )
                      }
                    />

                    <span className="login-checkbox-text">
                      Remember me
                    </span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="login-forgot-link"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="login-loading-text">
                      Signing In...
                    </span>
                  ) : (
                    <span className="login-btn-text">
                      Login
                      <span className="login-btn-arrow">
                        →
                      </span>
                    </span>
                  )}
                </button>

                {/* Register Link */}
                <div className="login-register-wrapper">
                  <p className="login-register-text">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="login-register-link"
                    >
                      Register
                    </Link>
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;