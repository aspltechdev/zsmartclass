// src/pages/InviteRegistration.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader } from "lucide-react";
import api from "../services/api";
import "./InviteRegistration.css";

function InviteRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    const checkInvitation = async () => {
      try {
        const response = await api.get(`/users/check-invitation/${token}`);
        if (response.data.success) {
          setUserData(response.data.data);
          setError("");
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Invalid or expired invitation"
        );
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/users/verify-invitation", {
        token,
        password,
      });

      if (response.data.success) {
        setSuccess(true);
        const { user, token: authToken } = response.data.data;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", authToken);
        localStorage.setItem("authToken", authToken);

        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to activate account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-registration-page">
        <div className="invite-loading">
          <Loader size={48} className="spinning" />
          <p>Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="invite-registration-page">
        <div className="invite-container">
          <div className="success-box">
            <CheckCircle size={64} className="success-icon" />
            <h1>Account Activated! 🎉</h1>
            <p>Your account has been successfully created.</p>
            <p className="success-sub">
              You will be redirected to your dashboard shortly...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-registration-page">
      <div className="invite-container">
        <div className="invite-card">
          <div className="invite-header">
            <h1>🎓 ZsmartClass</h1>
            <p>Complete your registration</p>
          </div>

          {error ? (
            <div className="invite-error">
              <AlertCircle size={24} />
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="invite-user-info">
                <h2>Welcome, {userData?.name}! 👋</h2>
                <p>
                  You've been invited to join ZsmartClass as a{" "}
                  <strong>{userData?.role?.toLowerCase()}</strong>.
                </p>
                <p className="invite-email">
                  <span>Email:</span> {userData?.email}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="invite-form">
                <div className="form-group">
                  <label>Set Your Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="form-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="invite-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={20} className="spinning" />
                      Activating...
                    </>
                  ) : (
                    "Activate Account"
                  )}
                </button>

                <p className="invite-footer-text">
                  This invitation will expire in 48 hours.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InviteRegistration;