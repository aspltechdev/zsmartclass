// // import { useState } from "react";
// // import { Link, useNavigate } from "react-router-dom";
// // import api from "../../services/api"; // adjust path if needed

// // function Register() {
// //   const navigate = useNavigate();

// //   const [form, setForm] = useState({
// //     name: "",
// //     email: "",
// //     password: "",
// //     // confirmPassword: "",
// //   });

// //   const [loading, setLoading] = useState(false);

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();

// //     if (
// //       !form.name ||
// //       !form.email ||
// //       !form.password ||
// //       !form.confirmPassword
// //     ) {
// //       alert("Please fill all fields");
// //       return;
// //     }

// //     if (form.password !== form.confirmPassword) {
// //       alert("Passwords do not match");
// //       return;
// //     }

// //     try {
// //       setLoading(true);

// //       const response = await api.post("/auth/register", {
// //         name: form.name,
// //         email: form.email,
// //         password: form.password,
// //       });

// //       console.log(response.data);

// //       alert("Registration Successful");

// //       navigate("/login");

// //     } catch (error) {
// //       console.error(error);

// //       alert(
// //         error.response?.data?.message ||
// //         "Registration Failed"
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="auth-container">
// //       <div className="auth-left">
// //         <h1>LMS Portal</h1>
// //         <p>Create your learning account.</p>
// //       </div>

// //       <div className="auth-right">
// //         <form
// //           className="auth-form"
// //           onSubmit={handleSubmit}
// //         >
// //           <h2>Create Account</h2>

// //           <input
// //             type="text"
// //             placeholder="Full Name"
// //             value={form.name}
// //             onChange={(e) =>
// //               setForm({
// //                 ...form,
// //                 name: e.target.value,
// //               })
// //             }
// //           />

// //           <input
// //             type="email"
// //             placeholder="Email Address"
// //             value={form.email}
// //             onChange={(e) =>
// //               setForm({
// //                 ...form,
// //                 email: e.target.value,
// //               })
// //             }
// //           />

// //           <input
// //             type="password"
// //             placeholder="Password"
// //             value={form.password}
// //             onChange={(e) =>
// //               setForm({
// //                 ...form,
// //                 password: e.target.value,
// //               })
// //             }
// //           />

// //           <input
// //             type="password"
// //             placeholder="Confirm Password"
// //             value={form.confirmPassword}
// //             onChange={(e) =>
// //               setForm({
// //                 ...form,
// //                 confirmPassword: e.target.value,
// //               })
// //             }
// //           />

// //           <button
// //             type="submit"
// //             disabled={loading}
// //           >
// //             {loading ? "Creating Account..." : "Sign Up"}
// //           </button>

// //           <p>
// //             Already have an account?
// //             <Link to="/login"> Sign In</Link>
// //           </p>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // }

// // export default Register;


// // import { useState } from "react";
// // import { Link, useNavigate } from "react-router-dom";
// // import api from "../../services/api";

// // function Register() {
// //   const navigate = useNavigate();

// //   const [form, setForm] = useState({
// //     name: "",
// //     email: "",
// //     password: "",
// //     confirmPassword: "",
// //   });

// //   const [loading, setLoading] = useState(false);

// //   const handleChange = (e) => {
// //     setForm({
// //       ...form,
// //       [e.target.name]: e.target.value,
// //     });
// //   };

// //   const validateForm = () => {
// //     if (
// //       !form.name.trim() ||
// //       !form.email.trim() ||
// //       !form.password ||
// //       !form.confirmPassword
// //     ) {
// //       alert("Please fill all fields.");
// //       return false;
// //     }

// //     if (form.password.length < 6) {
// //       alert("Password must be at least 6 characters.");
// //       return false;
// //     }

// //     if (form.password !== form.confirmPassword) {
// //       alert("Passwords do not match.");
// //       return false;
// //     }

// //     return true;
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();

// //     if (!validateForm()) return;

// //     try {
// //       setLoading(true);

// //       const res = await api.post("/auth/register", {
// //         name: form.name,
// //         email: form.email,
// //         password: form.password,
// //       });

// //       // Save email for OTP Verification page
// //       sessionStorage.setItem("verifyEmail", form.email);

// //       alert(res.data.message || "OTP sent successfully.");

// //       navigate("/verify-otp");

// //     } catch (err) {
// //       alert(
// //         err.response?.data?.message ||
// //         "Registration failed."
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="auth-page">

// //       <div className="auth-left">
// //         <h1>LMS Portal</h1>
// //         <p>Create your account and start learning.</p>
// //       </div>

// //       <div className="auth-right">

// //         <form className="auth-form" onSubmit={handleSubmit}>

// //           <h2>Create Account</h2>

// //           <input
// //             type="text"
// //             name="name"
// //             placeholder="Full Name"
// //             value={form.name}
// //             onChange={handleChange}
// //             required
// //           />

// //           <input
// //             type="email"
// //             name="email"
// //             placeholder="Email Address"
// //             value={form.email}
// //             onChange={handleChange}
// //             required
// //           />

// //           <input
// //             type="password"
// //             name="password"
// //             placeholder="Password"
// //             value={form.password}
// //             onChange={handleChange}
// //             required
// //           />

// //           <input
// //             type="password"
// //             name="confirmPassword"
// //             placeholder="Confirm Password"
// //             value={form.confirmPassword}
// //             onChange={handleChange}
// //             required
// //           />

// //           <button
// //             type="submit"
// //             disabled={loading}
// //           >
// //             {loading ? "Sending OTP..." : "Create Account"}
// //           </button>

// //           <p style={{ marginTop: "20px" }}>
// //             Already have an account?{" "}
// //             <Link to="/login">
// //               Login
// //             </Link>
// //           </p>

// //         </form>

// //       </div>

// //     </div>
// //   );
// // }

// // export default Register;


// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import api from "../../services/api";
// import "./Register.css";

// function Register() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const validateForm = () => {
//     if (
//       !form.name.trim() ||
//       !form.email.trim() ||
//       !form.password ||
//       !form.confirmPassword
//     ) {
//       alert("Please fill all fields.");
//       return false;
//     }

//     if (form.password.length < 6) {
//       alert("Password must be at least 6 characters.");
//       return false;
//     }

//     if (form.password !== form.confirmPassword) {
//       alert("Passwords do not match.");
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     try {
//       setLoading(true);

//       const res = await api.post("/auth/register", {
//         name: form.name,
//         email: form.email,
//         password: form.password,
//       });

//       // Save email for OTP Verification page
//       sessionStorage.setItem("verifyEmail", form.email);

//       alert(res.data.message || "OTP sent successfully.");

//       navigate("/verify-otp");

//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//         "Registration failed."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="register-wrapper">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
//       `}</style>

//       {/* Background Decorative Elements */}
//       <div className="register-bg-decoration">
//         <div className="register-bg-pattern" />
//         <div className="register-bg-glow-1" />
//         <div className="register-bg-glow-2" />
//         <div className="register-bg-line-1" />
//         <div className="register-bg-line-2" />
//       </div>

//       {/* Main Container */}
//       <motion.div 
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
//         className="register-container"
//       >
//         <div className="register-top-stripe" />

//         <div className="register-grid">
          
//           {/* LEFT - Branding Section */}
//           <div className="register-branding">
//             <div className="register-branding-pattern" />
//             <div className="register-branding-stripe" />
            
//             <div className="register-corner-tl" />
//             <div className="register-corner-tr" />
//             <div className="register-corner-bl" />
//             <div className="register-corner-br" />

//             <div className="register-branding-content">
//               {/* Logo Badge - ZsmartClass */}
//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: 0.2 }}
//                 className="register-logo-badge"
//               >
//                 <div className="register-logo-icon">
//                   <span className="register-logo-text">ZC</span>
//                 </div>
//                 <div className="register-logo-label">
//                   <span className="register-logo-title">ZsmartClass</span>
//                   <span className="register-logo-subtitle">Learning Management System</span>
//                 </div>
//               </motion.div>

//               {/* Main Branding */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.8, delay: 0.3 }}
//                 className="register-branding-main"
//               >
//                 <h1 className="register-branding-heading">
//                   Start Your
//                   <br />
//                   <span className="register-branding-highlight">Learning</span>
//                   <br />
//                   <span className="register-branding-highlight">Journey</span>
//                 </h1>
//               </motion.div>

//               {/* Tagline */}
//               <motion.p
//                 initial={{ opacity: 0, y: 15 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: 0.5 }}
//                 className="register-branding-tagline"
//               >
//                 Join thousands of learners and unlock your potential
//               </motion.p>

//               {/* Features */}
//               <motion.div
//                 initial={{ opacity: 0, y: 15 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: 0.6 }}
//                 className="register-features"
//               >
//                 <div className="register-feature-item">
//                   <span className="register-feature-icon">✓</span>
//                   Access 100+ premium courses
//                 </div>
//                 <div className="register-feature-item">
//                   <span className="register-feature-icon">✓</span>
//                   Learn from industry experts
//                 </div>
//                 <div className="register-feature-item">
//                   <span className="register-feature-icon">✓</span>
//                   Track your progress & earn certificates
//                 </div>
//               </motion.div>
//             </div>

//             {/* Footer Stats */}
//             <motion.div
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: 0.8 }}
//               className="register-branding-stats"
//             >
//               {[
//                 { label: 'Courses', value: '100+' },
//                 { label: 'Students', value: '5K+' },
//                 { label: 'Experts', value: '50+' }
//               ].map((item, i) => (
//                 <div key={i} className="register-stat-item">
//                   <div className="register-stat-value">{item.value}</div>
//                   <div className="register-stat-label">{item.label}</div>
//                 </div>
//               ))}
//             </motion.div>
//           </div>

//           {/* RIGHT - Register Form */}
//           <div className="register-form-wrapper">
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.8, delay: 0.3 }}
//               className="register-form-inner"
//             >
//               {/* Welcome Message */}
//               <div className="register-welcome">
//                 <h2 className="register-welcome-title">Create Account</h2>
//                 <p className="register-welcome-subtitle">
//                   Join ZsmartClass and start learning today
//                 </p>
//                 <div className="register-welcome-line" />
//               </div>

//               {/* Form */}
//               <form onSubmit={handleSubmit} className="register-form">
//                 {/* Full Name */}
//                 <div className="register-field-group">
//                   <label htmlFor="name" className="register-field-label">
//                     Full Name
//                   </label>
//                   <input
//                     id="name"
//                     type="text"
//                     name="name"
//                     className="register-field-input"
//                     placeholder="Enter your full name"
//                     value={form.name}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 {/* Email */}
//                 <div className="register-field-group">
//                   <label htmlFor="email" className="register-field-label">
//                     Email Address
//                   </label>
//                   <input
//                     id="email"
//                     type="email"
//                     name="email"
//                     className="register-field-input"
//                     placeholder="Enter your email"
//                     value={form.email}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 {/* Password */}
//                 <div className="register-field-group">
//                   <label htmlFor="password" className="register-field-label">
//                     Password
//                   </label>
//                   <input
//                     id="password"
//                     type="password"
//                     name="password"
//                     className="register-field-input"
//                     placeholder="Create a password"
//                     value={form.password}
//                     onChange={handleChange}
//                     required
//                   />
//                   <div className="register-password-hint">
//                     <span className="hint-dot" />
//                     Must be at least 6 characters
//                   </div>
//                 </div>

//                 {/* Confirm Password */}
//                 <div className="register-field-group">
//                   <label htmlFor="confirmPassword" className="register-field-label">
//                     Confirm Password
//                   </label>
//                   <input
//                     id="confirmPassword"
//                     type="password"
//                     name="confirmPassword"
//                     className="register-field-input"
//                     placeholder="Confirm your password"
//                     value={form.confirmPassword}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 {/* Submit Button */}
//                 <button 
//                   type="submit" 
//                   className="register-submit-btn"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <span className="register-loading-text">Sending OTP...</span>
//                   ) : (
//                     <span className="register-btn-text">
//                       Create Account
//                       <span className="register-btn-arrow">→</span>
//                     </span>
//                   )}
//                 </button>

//                 {/* Terms */}
//                 <p className="register-terms">
//                   By creating an account, you agree to our{' '}
//                   <Link to="/terms">Terms of Service</Link> and{' '}
//                   <Link to="/privacy">Privacy Policy</Link>
//                 </p>

//                 {/* Login Link */}
//                 <div className="register-login-wrapper">
//                   <p className="register-login-text">
//                     Already have an account?{' '}
//                     <Link to="/login" className="register-login-link">
//                       Sign In
//                     </Link>
//                   </p>
//                 </div>
//               </form>
//             </motion.div>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// export default Register;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    // Check empty fields
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill all fields.");
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      alert("Please enter a valid email address.");
      return false;
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      alert(
        "Password must contain at least 8 characters with uppercase, lowercase and number."
      );
      return false;
    }

    // Confirm password match
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Save email for OTP Verification page
      sessionStorage.setItem("verifyEmail", form.email.trim().toLowerCase());

      alert(res.data.message || "OTP sent successfully. Please verify your email.");

      // Clear form after success
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Navigate with email in router state
      navigate("/verify-otp", {
        state: {
          email: form.email.trim().toLowerCase()
        }
      });

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Background Decorative Elements */}
      <div className="register-bg-decoration">
        <div className="register-bg-pattern" />
        <div className="register-bg-glow-1" />
        <div className="register-bg-glow-2" />
        <div className="register-bg-line-1" />
        <div className="register-bg-line-2" />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="register-container"
      >
        <div className="register-top-stripe" />

        <div className="register-grid">
          
          {/* LEFT - Branding Section */}
          <div className="register-branding">
            <div className="register-branding-pattern" />
            <div className="register-branding-stripe" />
            
            <div className="register-corner-tl" />
            <div className="register-corner-tr" />
            <div className="register-corner-bl" />
            <div className="register-corner-br" />

            <div className="register-branding-content">
              {/* Logo Badge - ZsmartClass */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="register-logo-badge"
              >
                <div className="register-logo-icon">
                  <span className="register-logo-text">ZC</span>
                </div>
                <div className="register-logo-label">
                  <span className="register-logo-title">ZsmartClass</span>
                  <span className="register-logo-subtitle">Learning Management System</span>
                </div>
              </motion.div>

              {/* Main Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="register-branding-main"
              >
                <h1 className="register-branding-heading">
                  Start Your
                  <br />
                  <span className="register-branding-highlight">Learning</span>
                  <br />
                  <span className="register-branding-highlight">Journey</span>
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="register-branding-tagline"
              >
                Join thousands of learners and unlock your potential
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="register-features"
              >
                <div className="register-feature-item">
                  <span className="register-feature-icon">✓</span>
                  Access 100+ premium courses
                </div>
                <div className="register-feature-item">
                  <span className="register-feature-icon">✓</span>
                  Learn from industry experts
                </div>
                <div className="register-feature-item">
                  <span className="register-feature-icon">✓</span>
                  Track your progress & earn certificates
                </div>
              </motion.div>
            </div>

            {/* Footer Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="register-branding-stats"
            >
              {[
                { label: 'Courses', value: '100+' },
                { label: 'Students', value: '5K+' },
                { label: 'Experts', value: '50+' }
              ].map((item, i) => (
                <div key={i} className="register-stat-item">
                  <div className="register-stat-value">{item.value}</div>
                  <div className="register-stat-label">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT - Register Form */}
          <div className="register-form-wrapper">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="register-form-inner"
            >
              {/* Welcome Message */}
              <div className="register-welcome">
                <h2 className="register-welcome-title">Create Account</h2>
                <p className="register-welcome-subtitle">
                  Join ZsmartClass and start learning today
                </p>
                <div className="register-welcome-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="register-form">
                {/* Full Name */}
                <div className="register-field-group">
                  <label htmlFor="name" className="register-field-label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    className="register-field-input"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="register-field-group">
                  <label htmlFor="email" className="register-field-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    className="register-field-input"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password */}
                <div className="register-field-group">
                  <label htmlFor="password" className="register-field-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    className="register-field-input"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <div className="register-password-hint">
                    <span className="hint-dot" />
                    Min 8 chars: uppercase, lowercase & number
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="register-field-group">
                  <label htmlFor="confirmPassword" className="register-field-label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    className="register-field-input"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="register-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="register-loading-text">Creating Account...</span>
                  ) : (
                    <span className="register-btn-text">
                      Create Account
                      <span className="register-btn-arrow">→</span>
                    </span>
                  )}
                </button>

                {/* Terms */}
                <p className="register-terms">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms">Terms of Service</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>
                </p>

                {/* Login Link */}
                <div className="register-login-wrapper">
                  <p className="register-login-text">
                    Already have an account?{' '}
                    <Link to="/login" className="register-login-link">
                      Sign In
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

export default Register;