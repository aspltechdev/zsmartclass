// // import { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import api from "../../services/api";
// // import { useAuth } from "../../context/AuthContext";

// // function VerifyOTP() {

// //     const navigate = useNavigate();
// //     const { login } = useAuth();

// //     const [otp, setOTP] = useState("");

// //     const email = sessionStorage.getItem("verifyEmail");

// //     const handleVerify = async (e) => {

// //         e.preventDefault();

// //         try {

// //             const res = await api.post("/auth/verify-otp", {
// //                 email,
// //                 otp
// //             });

// //             login(res.data);

// //             sessionStorage.removeItem("verifyEmail");

// //             navigate("/dashboard");

// //         } catch (err) {

// //             alert(err.response?.data?.message);

// //         }

// //     };

// //     return (
// //         <div className="auth-container">

// //             <form onSubmit={handleVerify}>

// //                 <h2>Email Verification</h2>

// //                 <p>{email}</p>

// //                 <input
// //                     type="text"
// //                     maxLength={6}
// //                     placeholder="Enter OTP"
// //                     value={otp}
// //                     onChange={(e)=>setOTP(e.target.value)}
// //                 />

// //                 <button>
// //                     Verify OTP
// //                 </button>

// //             </form>

// //         </div>
// //     );

// // }

// // export default VerifyOTP;


// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../services/api";
// import { useAuth } from "../../context/AuthContext";

// function VerifyOTP() {
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const [otp, setOtp] = useState("");
//   const [loading, setLoading] = useState(false);

//   const email = sessionStorage.getItem("verifyEmail");

//   useEffect(() => {
//     if (!email) {
//       navigate("/register");
//     }
//   }, [email, navigate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (otp.length !== 6) {
//       return alert("Please enter a valid 6-digit OTP.");
//     }

//     try {
//       setLoading(true);

//       const res = await api.post("/auth/verify-otp", {
//         email,
//         otp,
//       });

//       login(res.data);

//       sessionStorage.removeItem("verifyEmail");

//       alert("Registration Successful!");

//       navigate("/dashboard");

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//         "OTP Verification Failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-page">

//       <div className="auth-left">
//         <h1>Email Verification</h1>
//         <p>Please enter the OTP sent to your email.</p>
//       </div>

//       <div className="auth-right">

//         <form
//           className="auth-form"
//           onSubmit={handleSubmit}
//         >

//           <h2>Verify OTP</h2>

//           <p
//             style={{
//               marginBottom: "20px",
//               color: "#666",
//             }}
//           >
//             {email}
//           </p>

//           <input
//             type="text"
//             placeholder="Enter 6-digit OTP"
//             maxLength={6}
//             value={otp}
//             onChange={(e) => setOtp(e.target.value)}
//             required
//           />

//           <button
//             type="submit"
//             disabled={loading}
//           >
//             {loading ? "Verifying..." : "Verify OTP"}
//           </button>

//         </form>

//       </div>

//     </div>
//   );
// }

// export default VerifyOTP;





import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./VerifyOTP.css";

function VerifyOTP() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const email = sessionStorage.getItem("verifyEmail");

  useEffect(() => {
    if (!email) {
      navigate("/register");
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

    if (otp.length !== 6) {
      return alert("Please enter a valid 6-digit OTP.");
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      login(res.data);

      sessionStorage.removeItem("verifyEmail");

      alert("Registration Successful!");

      navigate("/dashboard");

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

      const res = await api.post("/auth/resend-otp", {
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
    <div className="verify-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Background Decorative Elements */}
      <div className="verify-bg-decoration">
        <div className="verify-bg-pattern" />
        <div className="verify-bg-glow-1" />
        <div className="verify-bg-glow-2" />
        <div className="verify-bg-line-1" />
        <div className="verify-bg-line-2" />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="verify-container"
      >
        <div className="verify-top-stripe" />

        <div className="verify-grid">
          
          {/* LEFT - Branding Section */}
          <div className="verify-branding">
            <div className="verify-branding-pattern" />
            <div className="verify-branding-stripe" />
            
            <div className="verify-corner-tl" />
            <div className="verify-corner-tr" />
            <div className="verify-corner-bl" />
            <div className="verify-corner-br" />

            <div className="verify-branding-content">
              {/* Logo Badge - ZsmartClass */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="verify-logo-badge"
              >
                <div className="verify-logo-icon">
                  <span className="verify-logo-text">ZC</span>
                </div>
                <div className="verify-logo-label">
                  <span className="verify-logo-title">ZsmartClass</span>
                  <span className="verify-logo-subtitle">Learning Management System</span>
                </div>
              </motion.div>

              {/* Main Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="verify-branding-main"
              >
                <h1 className="verify-branding-heading">
                  Verify Your
                  <br />
                  <span className="verify-branding-highlight">Email</span>
                  <br />
                  <span className="verify-branding-highlight">Address</span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="verify-branding-tagline"
              >
                Enter the 6-digit code sent to your email to complete registration
              </motion.p>

              {/* OTP Info */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="verify-otp-info"
              >
                <div className="verify-otp-item">
                  <span className="verify-otp-icon">📧</span>
                  Check your inbox for the OTP
                </div>
                <div className="verify-otp-item">
                  <span className="verify-otp-icon">⏱️</span>
                  OTP expires in 5 minutes
                </div>
                <div className="verify-otp-item">
                  <span className="verify-otp-icon">🔒</span>
                  Secure verification process
                </div>
              </motion.div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="verify-branding-stats"
            >
              {[
                { label: 'Courses', value: '100+' },
                { label: 'Students', value: '5K+' },
                { label: 'Experts', value: '50+' }
              ].map((item, i) => (
                <div key={i} className="verify-stat-item">
                  <div className="verify-stat-value">{item.value}</div>
                  <div className="verify-stat-label">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT - Verify OTP Form */}
          <div className="verify-form-wrapper">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="verify-form-inner"
            >
              {/* Welcome Message */}
              <div className="verify-welcome">
                <h2 className="verify-welcome-title">Verify OTP</h2>
                <p className="verify-welcome-subtitle">
                  Enter the verification code sent to your email
                </p>
                <div className="verify-welcome-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="verify-form">
                {/* Email Display */}
                <div className="verify-email-display">
                  <span className="verify-email-icon">📧</span>
                  <span className="verify-email-text">{email}</span>
                </div>

                {/* OTP Input */}
                <div className="verify-field-group">
                  <label htmlFor="otp" className="verify-field-label">
                    Enter OTP
                  </label>
                  <div className="verify-otp-container">
                    <input
                      id="otp"
                      type="text"
                      className="verify-field-input"
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
                  <div className="verify-otp-hint">
                    <span className="hint-dot" />
                    Enter the 6-digit code
                  </div>
                </div>

                {/* Resend OTP */}
                <div className="verify-resend-wrapper">
                  <p className="verify-resend-text">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      className="verify-resend-link"
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
                  className="verify-submit-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <span className="verify-loading-text">Verifying...</span>
                  ) : (
                    <span className="verify-btn-text">
                      Verify OTP
                      <span className="verify-btn-arrow">→</span>
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

export default VerifyOTP;