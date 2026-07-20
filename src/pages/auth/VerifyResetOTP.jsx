// import { useEffect, useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import api from "../../services/api";

// function VerifyResetOTP() {
//   const navigate = useNavigate();

//   const email = sessionStorage.getItem("resetEmail");

//   const [otp, setOtp] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!email) {
//       navigate("/forgot-password");
//     }
//   }, [email, navigate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!otp.trim()) {
//       return alert("Please enter the OTP.");
//     }

//     if (otp.length !== 6) {
//       return alert("OTP must be 6 digits.");
//     }

//     try {
//       setLoading(true);

//       const res = await api.post("/auth/verify-reset-otp", {
//         email,
//         otp,
//       });

//       alert(res.data.message || "OTP Verified Successfully");

//       navigate("/reset-password");

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//           "OTP Verification Failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-page">

//       <div className="auth-left">
//         <h1>Verify OTP</h1>
//         <p>Enter the verification code sent to your email.</p>
//       </div>

//       <div className="auth-right">

//         <form className="auth-form" onSubmit={handleSubmit}>

//           <h2>Email Verification</h2>

//           <p
//             style={{
//               marginBottom: "20px",
//               color: "#666",
//               fontSize: "14px",
//             }}
//           >
//             {email}
//           </p>

//           <input
//             type="text"
//             placeholder="Enter 6 Digit OTP"
//             value={otp}
//             maxLength={6}
//             onChange={(e) => setOtp(e.target.value)}
//             required
//           />

//           <button type="submit" disabled={loading}>
//             {loading ? "Verifying..." : "Verify OTP"}
//           </button>

//           <div
//             style={{
//               marginTop: "20px",
//               textAlign: "center",
//             }}
//           >
//             <Link to="/forgot-password">
//               Back
//             </Link>
//           </div>

//         </form>

//       </div>

//     </div>
//   );
// }

// export default VerifyResetOTP;

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import "./VerifyResetOTP.css";

function VerifyResetOTP() {
  const navigate = useNavigate();

  const email = sessionStorage.getItem("resetEmail");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Timer for OTP resend
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      return alert("Please enter the OTP.");
    }

    if (otp.length !== 6) {
      return alert("OTP must be 6 digits.");
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-reset-otp", {
        email,
        otp,
      });

      alert(res.data.message || "OTP Verified Successfully");

      navigate("/reset-password");

    } catch (err) {
      alert(
        err.response?.data?.message ||
          "OTP Verification Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      setResendLoading(true);

      const res = await api.post("/auth/reset-resend-otp", {
        email,
      });

      alert(res.data.message || "OTP resent successfully!");

      setTimer(60);
      setCanResend(false);

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-reset-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Background Decorative Elements */}
      <div className="verify-reset-bg-decoration">
        <div className="verify-reset-bg-pattern" />
        <div className="verify-reset-bg-glow-1" />
        <div className="verify-reset-bg-glow-2" />
        <div className="verify-reset-bg-line-1" />
        <div className="verify-reset-bg-line-2" />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="verify-reset-container"
      >
        <div className="verify-reset-top-stripe" />

        <div className="verify-reset-grid">
          
          {/* LEFT - Branding Section */}
          <div className="verify-reset-branding">
            <div className="verify-reset-branding-pattern" />
            <div className="verify-reset-branding-stripe" />
            
            <div className="verify-reset-corner-tl" />
            <div className="verify-reset-corner-tr" />
            <div className="verify-reset-corner-bl" />
            <div className="verify-reset-corner-br" />

            <div className="verify-reset-branding-content">
              {/* Logo Badge - ZsmartClass */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="verify-reset-logo-badge"
              >
                <div className="verify-reset-logo-icon">
                  <span className="verify-reset-logo-text">ZC</span>
                </div>
                <div className="verify-reset-logo-label">
                  <span className="verify-reset-logo-title">ZsmartClass</span>
                  <span className="verify-reset-logo-subtitle">Learning Management System</span>
                </div>
              </motion.div>

              {/* Main Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="verify-reset-branding-main"
              >
                <h1 className="verify-reset-branding-heading">
                  Verify
                  <br />
                  <span className="verify-reset-branding-highlight">Password</span>
                  <br />
                  <span className="verify-reset-branding-highlight">Reset</span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="verify-reset-branding-tagline"
              >
                Enter the 6-digit code sent to your email to reset your password
              </motion.p>

              {/* OTP Info */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="verify-reset-otp-info"
              >
                <div className="verify-reset-otp-item">
                  <span className="verify-reset-otp-icon">📧</span>
                  Check your inbox for the reset OTP
                </div>
                <div className="verify-reset-otp-item">
                  <span className="verify-reset-otp-icon">⏱️</span>
                  OTP expires in 5 minutes
                </div>
                <div className="verify-reset-otp-item">
                  <span className="verify-reset-otp-icon">🔒</span>
                  Secure password reset process
                </div>
              </motion.div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="verify-reset-branding-stats"
            >
              {[
                { label: 'Courses', value: '100+' },
                { label: 'Students', value: '5K+' },
                { label: 'Experts', value: '50+' }
              ].map((item, i) => (
                <div key={i} className="verify-reset-stat-item">
                  <div className="verify-reset-stat-value">{item.value}</div>
                  <div className="verify-reset-stat-label">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT - Verify Reset OTP Form */}
          <div className="verify-reset-form-wrapper">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="verify-reset-form-inner"
            >
              {/* Welcome Message */}
              <div className="verify-reset-welcome">
                <h2 className="verify-reset-welcome-title">Verify OTP</h2>
                <p className="verify-reset-welcome-subtitle">
                  Enter the verification code to reset your password
                </p>
                <div className="verify-reset-welcome-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="verify-reset-form">
                {/* Email Display */}
                <div className="verify-reset-email-display">
                  <span className="verify-reset-email-icon">📧</span>
                  <span className="verify-reset-email-text">{email}</span>
                </div>

                {/* OTP Input */}
                <div className="verify-reset-field-group">
                  <label htmlFor="otp" className="verify-reset-field-label">
                    Enter OTP
                  </label>
                  <div className="verify-reset-otp-container">
                    <input
                      id="otp"
                      type="text"
                      className="verify-reset-field-input"
                      placeholder="• • • • • •"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                    {timer > 0 && (
                      <span className="otp-timer">
                        <span className="timer-text">{timer}s</span>
                      </span>
                    )}
                  </div>
                  <div className="verify-reset-otp-hint">
                    <span className="hint-dot" />
                    Enter the 6-digit code sent to your email
                  </div>
                </div>

                {/* Resend OTP */}
                <div className="verify-reset-resend-wrapper">
                  <p className="verify-reset-resend-text">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      className="verify-reset-resend-link"
                      onClick={handleResendOTP}
                      disabled={!canResend || resendLoading}
                    >
                      {resendLoading ? 'Sending...' : 'Resend OTP'}
                    </button>
                    {!canResend && timer > 0 && (
                      <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                        {' '}in {timer}s
                      </span>
                    )}
                  </p>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="verify-reset-submit-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <span className="verify-reset-loading-text">Verifying...</span>
                  ) : (
                    <span className="verify-reset-btn-text">
                      Verify OTP
                      <span className="verify-reset-btn-arrow">→</span>
                    </span>
                  )}
                </button>

                {/* Back Link */}
                <div className="verify-reset-back-wrapper">
                  <p className="verify-reset-back-text">
                    <Link to="/forgot-password" className="verify-reset-back-link">
                      <span className="back-arrow">←</span> Back to Forgot Password
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

export default VerifyResetOTP;