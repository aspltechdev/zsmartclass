// src/pages/student/Profile.jsx
//
// Modelled on AdminProfile, with the admin/mentor-only fields removed:
//   - Role        (editable there; a student must never set their own role)
//   - Expertise   (mentor field)
//   - Social Link (mentor field)
//   - Bio         (not used for students)
// Email is shown read-only, since changing it should require verification.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, FileText, Shield, Camera, Trash2, Save, X, Loader,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle, CalendarDays, LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./Profile.css";
import "./StudentShared.css";

function Profile() {
  const navigate = useNavigate();
  const { updateUser: updateAuthUser, logout } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", bio: "", profileImage: "", createdAt: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => { loadProfile(); }, []);

  const flash = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: "", message: "" }), 4000);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/me");
      const user = res.data?.data || res.data || {};
      setForm({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        profileImage: user.profileImage || "",
        createdAt: user.createdAt || "",
      });
      setImagePreview(user.profileImage || "");
    } catch (err) {
      flash("error", err.response?.data?.message || "Couldn't load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return flash("error", "Please choose an image file.");
    if (file.size > 2 * 1024 * 1024) return flash("error", "Image must be under 2MB.");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm((prev) => ({ ...prev, profileImage: "" }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return flash("error", "Name is required.");
    try {
      setSaving(true);

      // Only name / bio / image are sent — never role or email.
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("bio", form.bio || "");
      if (imageFile) payload.append("profileImage", imageFile);
      else if (!imagePreview) payload.append("profileImage", "");

      const res = await api.put("/users/update-profile", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data?.data || res.data || {};
      setForm((prev) => ({
        ...prev,
        name: updated.name ?? prev.name,
        bio: updated.bio ?? prev.bio,
        profileImage: updated.profileImage ?? prev.profileImage,
      }));

      // Sync into AuthContext (and storage) so the header avatar reflects
      // the new photo/name immediately, without needing a re-login.
      if (updated && typeof updated === "object") updateAuthUser(updated);

      setImageFile(null);
      setIsEditing(false);
      flash("success", "Profile updated.");
    } catch (err) {
      flash("error", err.response?.data?.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(form.profileImage || "");
    loadProfile();
  };

  const handleLogout = () => {
    // Clears AuthContext state as well as storage.
    if (typeof logout === "function") logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/login", { replace: true });
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = "Enter your current password.";
    if (!passwordForm.newPassword) errors.newPassword = "Enter a new password.";
    else if (passwordForm.newPassword.length < 6) errors.newPassword = "Use at least 6 characters.";
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errors.confirmPassword = "Passwords don't match.";
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    try {
      setChangingPassword(true);
      await api.put("/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      flash("success", "Password changed.");
    } catch (err) {
      setPasswordErrors({
        currentPassword: err.response?.data?.message || "Couldn't change password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name) =>
    (name || "S").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const joinedLabel = form.createdAt
    ? new Date(form.createdAt).toLocaleDateString("en-IN",
        { day: "numeric", month: "long", year: "numeric" })
    : "—";

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-spinner" />
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">

        <div className="profile-header">
          <div className="profile-heading">
            <div className="profile-heading-icon">
              <User size={26} />
            </div>
            <div>
              <h1>My Profile</h1>
              <p className="subtitle">Manage your personal details</p>
            </div>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                <User size={17} /> Edit Profile
              </button>
            ) : (
              <>
                <button className="btn-secondary" onClick={handleCancel}>
                  <X size={17} /> Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><Loader size={17} className="spinning" /> Saving…</>
                    : <><Save size={17} /> Save Changes</>}
                </button>
              </>
            )}
          </div>
        </div>

        {alert.message && (
          <div className={`alert alert-${alert.type}`}>
            {alert.type === "success" ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="profile-grid">

          <div className="profile-image-section">
            <div className="profile-image-container">
              <div className="profile-image-wrapper">
                {imagePreview
                  ? <img src={imagePreview} alt={form.name} />
                  : <div className="profile-image-placeholder">
                      <span className="initials">{getInitials(form.name)}</span>
                    </div>}

                {isEditing && (
                  <>
                    <label className="profile-image-overlay" htmlFor="profile-image-upload">
                      <Camera size={16} /> Change
                    </label>
                    <input id="profile-image-upload" type="file" accept="image/*"
                           onChange={handleImageSelect} hidden />
                    {imagePreview && (
                      <button className="remove-image-btn" onClick={handleRemoveImage}
                              aria-label="Remove photo">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </>
                )}
              </div>

              <h2 className="profile-name">{form.name || "Student"}</h2>

              <span className="profile-role-badge">
                <Shield size={13} /> Student
              </span>

              <span className="profile-joined">
                <CalendarDays size={13} /> Joined {joinedLabel}
              </span>
            </div>

            <div className="profile-quick-actions">
              <button className="quick-action-btn" onClick={() => setShowPasswordModal(true)}>
                <Lock size={16} /> Change Password
              </button>
              <button className="quick-action-btn danger" onClick={handleLogout}>
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>

          <div className="profile-details-section">
            <div className="details-card">
              <h3>Personal Information</h3>

              <div className="details-grid">
                <div className="detail-field">
                  <label><User size={15} /> Full Name</label>
                  {isEditing
                    ? <input type="text" name="name" value={form.name}
                             onChange={handleInputChange} placeholder="Enter your full name" />
                    : <p className="field-value">{form.name || "Not set"}</p>}
                </div>

                <div className="detail-field full-width">
                  <label><FileText size={15} /> About Me</label>
                  {isEditing
                    ? <textarea name="bio" value={form.bio}
                                onChange={handleInputChange} rows={3}
                                placeholder="Tell us a little about yourself" />
                    : <p className="field-value">{form.bio || "No bio yet"}</p>}
                </div>

                <div className="detail-field full-width">
                  <label><Mail size={15} /> Email</label>
                  <p className="field-value locked">
                    {form.email || "Not set"}
                    <span className="locked-tag">
                      <Lock size={11} /> Contact support to change
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}
                      aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Current Password *</label>
                <div className="password-input-wrapper">
                  <input type={showCurrent ? "text" : "password"}
                         value={passwordForm.currentPassword}
                         onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                         placeholder="Enter current password" />
                  <button type="button" className="password-toggle"
                          onClick={() => setShowCurrent(!showCurrent)}
                          aria-label="Toggle password visibility">
                    {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className="error-text">{passwordErrors.currentPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <div className="password-input-wrapper">
                  <input type={showNew ? "text" : "password"}
                         value={passwordForm.newPassword}
                         onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                         placeholder="At least 6 characters" />
                  <button type="button" className="password-toggle"
                          onClick={() => setShowNew(!showNew)}
                          aria-label="Toggle password visibility">
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="error-text">{passwordErrors.newPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input type="password" value={passwordForm.confirmPassword}
                       onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                       placeholder="Re-enter new password" />
                {passwordErrors.confirmPassword && (
                  <span className="error-text">{passwordErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword
                  ? <><Loader size={16} className="spinning" /> Updating…</>
                  : <><Lock size={16} /> Update Password</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;