

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("resetEmail");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return "";
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (password.length === 0) return "";
    if (passwordStrength <= 1) return "weak";
    if (passwordStrength <= 3) return "medium";
    return "strong";
  };

  const getMatchStatus = () => {
    if (confirmPassword.length === 0) return null;
    if (password === confirmPassword) return "success";
    return "error";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      return alert("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match.");
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/reset-password", {
        email,
        password,
      });

      alert(res.data.message || "Password updated successfully!");

      sessionStorage.removeItem("resetEmail");

      navigate("/login");

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Reset Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Background Decorative Elements */}
      <div className="reset-bg-decoration">
        <div className="reset-bg-pattern" />
        <div className="reset-bg-glow-1" />
        <div className="reset-bg-glow-2" />
        <div className="reset-bg-line-1" />
        <div className="reset-bg-line-2" />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="reset-container"
      >
        <div className="reset-top-stripe" />

        <div className="reset-grid">
          
          {/* LEFT - Branding Section */}
          <div className="reset-branding">
            <div className="reset-branding-pattern" />
            <div className="reset-branding-stripe" />
            
            <div className="reset-corner-tl" />
            <div className="reset-corner-tr" />
            <div className="reset-corner-bl" />
            <div className="reset-corner-br" />

            <div className="reset-branding-content">
              {/* Logo Badge - ZsmartClass */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="reset-logo-badge"
              >
                <div className="reset-logo-icon">
                  <span className="reset-logo-text">ZC</span>
                </div>
                <div className="reset-logo-label">
                  <span className="reset-logo-title">ZsmartClass</span>
                  <span className="reset-logo-subtitle">Learning Management System</span>
                </div>
              </motion.div>

              {/* Main Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="reset-branding-main"
              >
                <h1 className="reset-branding-heading">
                  Create New
                  <br />
                  <span className="reset-branding-highlight">Password</span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="reset-branding-tagline"
              >
                Your new password must be strong and secure
              </motion.p>

              {/* Password Requirements */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="reset-requirements"
              >
                <div className="reset-requirement-item">
                  <span className="reset-requirement-icon">✓</span>
                  Minimum 6 characters
                </div>
                <div className="reset-requirement-item">
                  <span className="reset-requirement-icon">✓</span>
                  Use a mix of letters, numbers & symbols
                </div>
                <div className="reset-requirement-item">
                  <span className="reset-requirement-icon">✓</span>
                  Avoid common passwords
                </div>
              </motion.div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="reset-branding-stats"
            >
              {[
                { label: 'Courses', value: '100+' },
                { label: 'Students', value: '5K+' },
                { label: 'Experts', value: '50+' }
              ].map((item, i) => (
                <div key={i} className="reset-stat-item">
                  <div className="reset-stat-value">{item.value}</div>
                  <div className="reset-stat-label">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT - Reset Password Form */}
          <div className="reset-form-wrapper">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="reset-form-inner"
            >
              {/* Welcome Message */}
              <div className="reset-welcome">
                <h2 className="reset-welcome-title">New Password</h2>
                <p className="reset-welcome-subtitle">
                  Create a strong password for your account
                </p>
                <div className="reset-welcome-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="reset-form">
                {/* New Password */}
                <div className="reset-field-group">
                  <label htmlFor="password" className="reset-field-label">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="reset-field-input"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="reset-password-strength">
                      <div className="reset-strength-bar">
                        {[0, 1, 2, 3, 4].map((index) => (
                          <div
                            key={index}
                            className={`reset-strength-segment ${
                              index < passwordStrength
                                ? `active-${getStrengthColor()}`
                                : ''
                            }`}
                          />
                        ))}
                      </div>
                      <span className="reset-strength-text">
                        {getStrengthLabel()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="reset-field-group">
                  <label htmlFor="confirmPassword" className="reset-field-label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="reset-field-input"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  
                  {/* Match Indicator */}
                  {confirmPassword.length > 0 && (
                    <div className={`reset-password-match match-${getMatchStatus()}`}>
                      <span className="match-icon">
                        {getMatchStatus() === 'success' ? '✅' : '❌'}
                      </span>
                      {getMatchStatus() === 'success' 
                        ? 'Passwords match!' 
                        : 'Passwords do not match'}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="reset-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="reset-loading-text">Updating...</span>
                  ) : (
                    <span className="reset-btn-text">
                      Update Password
                      <span className="reset-btn-arrow">→</span>
                    </span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPassword;