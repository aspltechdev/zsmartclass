// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../services/api";
// import { useAuth } from "../../context/AuthContext";

// function VerifyOTP() {

//     const navigate = useNavigate();
//     const { login } = useAuth();

//     const [otp, setOTP] = useState("");

//     const email = sessionStorage.getItem("verifyEmail");

//     const handleVerify = async (e) => {

//         e.preventDefault();

//         try {

//             const res = await api.post("/auth/verify-otp", {
//                 email,
//                 otp
//             });

//             login(res.data);

//             sessionStorage.removeItem("verifyEmail");

//             navigate("/dashboard");

//         } catch (err) {

//             alert(err.response?.data?.message);

//         }

//     };

//     return (
//         <div className="auth-container">

//             <form onSubmit={handleVerify}>

//                 <h2>Email Verification</h2>

//                 <p>{email}</p>

//                 <input
//                     type="text"
//                     maxLength={6}
//                     placeholder="Enter OTP"
//                     value={otp}
//                     onChange={(e)=>setOTP(e.target.value)}
//                 />

//                 <button>
//                     Verify OTP
//                 </button>

//             </form>

//         </div>
//     );

// }

// export default VerifyOTP;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function VerifyOTP() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const email = sessionStorage.getItem("verifyEmail");

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

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

  return (
    <div className="auth-page">

      <div className="auth-left">
        <h1>Email Verification</h1>
        <p>Please enter the OTP sent to your email.</p>
      </div>

      <div className="auth-right">

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <h2>Verify OTP</h2>

          <p
            style={{
              marginBottom: "20px",
              color: "#666",
            }}
          >
            {email}
          </p>

          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default VerifyOTP;