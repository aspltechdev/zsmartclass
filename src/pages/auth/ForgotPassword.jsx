import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

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
    <div className="auth-page">

      <div className="auth-left">
        <h1>Forgot Password</h1>
        <p>Reset your password securely.</p>
      </div>

      <div className="auth-right">

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <h2>Forgot Password</h2>

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <p style={{ marginTop: 20 }}>
            <Link to="/login">
              Back to Login
            </Link>
          </p>

        </form>

      </div>

    </div>
  );
}

export default ForgotPassword;