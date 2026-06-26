// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import api from "../../services/api"; // adjust path if needed

// function Register() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     // confirmPassword: "",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (
//       !form.name ||
//       !form.email ||
//       !form.password ||
//       !form.confirmPassword
//     ) {
//       alert("Please fill all fields");
//       return;
//     }

//     if (form.password !== form.confirmPassword) {
//       alert("Passwords do not match");
//       return;
//     }

//     try {
//       setLoading(true);

//       const response = await api.post("/auth/register", {
//         name: form.name,
//         email: form.email,
//         password: form.password,
//       });

//       console.log(response.data);

//       alert("Registration Successful");

//       navigate("/login");

//     } catch (error) {
//       console.error(error);

//       alert(
//         error.response?.data?.message ||
//         "Registration Failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-left">
//         <h1>LMS Portal</h1>
//         <p>Create your learning account.</p>
//       </div>

//       <div className="auth-right">
//         <form
//           className="auth-form"
//           onSubmit={handleSubmit}
//         >
//           <h2>Create Account</h2>

//           <input
//             type="text"
//             placeholder="Full Name"
//             value={form.name}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 name: e.target.value,
//               })
//             }
//           />

//           <input
//             type="email"
//             placeholder="Email Address"
//             value={form.email}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 email: e.target.value,
//               })
//             }
//           />

//           <input
//             type="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 password: e.target.value,
//               })
//             }
//           />

//           <input
//             type="password"
//             placeholder="Confirm Password"
//             value={form.confirmPassword}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 confirmPassword: e.target.value,
//               })
//             }
//           />

//           <button
//             type="submit"
//             disabled={loading}
//           >
//             {loading ? "Creating Account..." : "Sign Up"}
//           </button>

//           <p>
//             Already have an account?
//             <Link to="/login"> Sign In</Link>
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default Register;


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

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
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill all fields.");
      return false;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return false;
    }

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
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // Save email for OTP Verification page
      sessionStorage.setItem("verifyEmail", form.email);

      alert(res.data.message || "OTP sent successfully.");

      navigate("/verify-otp");

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-left">
        <h1>LMS Portal</h1>
        <p>Create your account and start learning.</p>
      </div>

      <div className="auth-right">

        <form className="auth-form" onSubmit={handleSubmit}>

          <h2>Create Account</h2>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Create Account"}
          </button>

          <p style={{ marginTop: "20px" }}>
            Already have an account?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>

        </form>

      </div>

    </div>
  );
}

export default Register;