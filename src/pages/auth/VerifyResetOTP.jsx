import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

function VerifyResetOTP() {
  const navigate = useNavigate();

  const email = sessionStorage.getItem("resetEmail");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

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

  return (
    <div className="auth-page">

      <div className="auth-left">
        <h1>Verify OTP</h1>
        <p>Enter the verification code sent to your email.</p>
      </div>

      <div className="auth-right">

        <form className="auth-form" onSubmit={handleSubmit}>

          <h2>Email Verification</h2>

          <p
            style={{
              marginBottom: "20px",
              color: "#666",
              fontSize: "14px",
            }}
          >
            {email}
          </p>

          <input
            type="text"
            placeholder="Enter 6 Digit OTP"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            <Link to="/forgot-password">
              Back
            </Link>
          </div>

        </form>

      </div>

    </div>
  );
}

export default VerifyResetOTP;