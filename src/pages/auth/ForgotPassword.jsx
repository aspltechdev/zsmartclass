// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import api from "../../services/api";

// function ForgotPassword() {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!email) {
//       return alert("Please enter your email.");
//     }

//     try {
//       setLoading(true);

//       const res = await api.post("/auth/forgot-password", {
//         email,
//       });

//       alert(res.data.message);

//       sessionStorage.setItem("resetEmail", email);

//       navigate("/verify-reset-otp");

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//         "Unable to send OTP."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-page">

//       <div className="auth-left">
//         <h1>Forgot Password</h1>
//         <p>Reset your password securely.</p>
//       </div>

//       <div className="auth-right">

//         <form
//           className="auth-form"
//           onSubmit={handleSubmit}
//         >

//           <h2>Forgot Password</h2>

//           <input
//             type="email"
//             placeholder="Enter Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />

//           <button
//             type="submit"
//             disabled={loading}
//           >
//             {loading ? "Sending OTP..." : "Send OTP"}
//           </button>

//           <p style={{ marginTop: 20 }}>
//             <Link to="/login">
//               Back to Login
//             </Link>
//           </p>

//         </form>

//       </div>

//     </div>
//   );
// }

// export default ForgotPassword;


import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return alert("Please enter your email.");
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/forgot-password", {
        email,
      });

      alert(res.data.message);

      sessionStorage.setItem("resetEmail", email);

      navigate("/verify-reset-otp");

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Background Decorative Elements */}
      <div className="forgot-bg-decoration">
        <div className="forgot-bg-pattern" />
        <div className="forgot-bg-glow-1" />
        <div className="forgot-bg-glow-2" />
        <div className="forgot-bg-line-1" />
        <div className="forgot-bg-line-2" />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="forgot-container"
      >
        <div className="forgot-top-stripe" />

        <div className="forgot-grid">
          
          {/* LEFT - Branding Section */}
          <div className="forgot-branding">
            <div className="forgot-branding-pattern" />
            <div className="forgot-branding-stripe" />
            
            <div className="forgot-corner-tl" />
            <div className="forgot-corner-tr" />
            <div className="forgot-corner-bl" />
            <div className="forgot-corner-br" />

            <div className="forgot-branding-content">
              {/* Logo Badge - ZsmartClass */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="forgot-logo-badge"
              >
                <div className="forgot-logo-icon">
                  <span className="forgot-logo-text">ZC</span>
                </div>
                <div className="forgot-logo-label">
                  <span className="forgot-logo-title">ZsmartClass</span>
                  <span className="forgot-logo-subtitle">Learning Management System</span>
                </div>
              </motion.div>

              {/* Main Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="forgot-branding-main"
              >
                <h1 className="forgot-branding-heading">
                  Reset Your
                  <br />
                  <span className="forgot-branding-highlight">Password</span>
                  <br />
                  <span className="forgot-branding-highlight">Securely</span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="forgot-branding-tagline"
              >
                We'll send you a verification code to reset your password
              </motion.p>

              {/* Security Tips */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="forgot-security-tips"
              >
                <div className="forgot-security-item">
                  <span className="forgot-security-icon">🔒</span>
                  Enter your registered email address
                </div>
                <div className="forgot-security-item">
                  <span className="forgot-security-icon">📧</span>
                  Check your inbox for the OTP
                </div>
                <div className="forgot-security-item">
                  <span className="forgot-security-icon">🔄</span>
                  Reset your password securely
                </div>
              </motion.div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="forgot-branding-stats"
            >
              {[
                { label: 'Courses', value: '100+' },
                { label: 'Students', value: '5K+' },
                { label: 'Experts', value: '50+' }
              ].map((item, i) => (
                <div key={i} className="forgot-stat-item">
                  <div className="forgot-stat-value">{item.value}</div>
                  <div className="forgot-stat-label">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT - Forgot Password Form */}
          <div className="forgot-form-wrapper">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="forgot-form-inner"
            >
              {/* Welcome Message */}
              <div className="forgot-welcome">
                <h2 className="forgot-welcome-title">Forgot Password?</h2>
                <p className="forgot-welcome-subtitle">
                  Don't worry, we'll help you reset it
                </p>
                <div className="forgot-welcome-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="forgot-form">
                {/* Email */}
                <div className="forgot-field-group">
                  <label htmlFor="email" className="forgot-field-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="forgot-field-input"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Info Text */}
                <div className="forgot-info-text">
                  <span className="forgot-info-icon">💡</span>
                  <div className="forgot-info-content">
                    <strong>Tip:</strong> We'll send a 6-digit OTP to your email. 
                    Make sure to check your spam folder if you don't see it.
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="forgot-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="forgot-loading-text">Sending OTP...</span>
                  ) : (
                    <span className="forgot-btn-text">
                      Send OTP
                      <span className="forgot-btn-arrow">→</span>
                    </span>
                  )}
                </button>

                {/* Back to Login Link */}
                <div className="forgot-back-wrapper">
                  <p className="forgot-back-text">
                    <Link to="/login" className="forgot-back-link">
                      <span className="back-arrow">←</span> Back to Login
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

export default ForgotPassword;