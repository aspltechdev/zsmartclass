// src/pages/admin/AdminProfile.jsx
import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Shield,
  Camera,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  Edit,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./AdminProfile.css";

function AdminProfile() {
  const { user: authUser, updateUser: updateAuthUser } = useAuth();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    expertise: "",
    bio: "",
    socialLink: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (authUser) {
      setForm({
        name: authUser.name || "",
        email: authUser.email || "",
        role: authUser.role || "ADMIN",
        expertise: authUser.expertise || "",   
        bio: authUser.bio || "",
        socialLink: authUser.social_links || authUser.socialLink || "", 
      });
      setProfileImage(authUser.profileImage || null);
      setImagePreview(authUser.profileImage || null);
    }
  }, [authUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB.");
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.email) {
        setError("Email is required to update profile.");
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("role", form.role);
      formData.append("expertise", form.expertise || "");    
      formData.append("bio", form.bio || "");
      formData.append("socialLink", form.socialLink || "");

      // Only append the file if the user actually picked a new one.
      // (profileImage is a File object when freshly selected; when it's
      // still the original string URL from the server, there's nothing
      // new to upload.)
      if (profileImage instanceof File) {
        formData.append("profileImage", profileImage);
      }

      // 🔥 IMPORTANT: The backend route we just added
      const response = await api.put(`/users/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 201) {
        const returnedData = response.data;
        let updatedUser = returnedData.data || returnedData.user || returnedData;

        if (Array.isArray(updatedUser)) updatedUser = updatedUser[0];

        if (updatedUser && typeof updatedUser === 'object') {
          // Update screen UI
          setForm({
            name: updatedUser.name || "",
            email: updatedUser.email || "",
            role: updatedUser.role || "ADMIN",
            expertise: updatedUser.expertise || "",
            bio: updatedUser.bio || "",
            socialLink: updatedUser.social_links || updatedUser.socialLink || "",
          });
          if (updatedUser.profileImage) setImagePreview(updatedUser.profileImage);

          // Also sync into AuthContext (and localStorage/sessionStorage)
          // so the change survives a page refresh instead of only living
          // in this component's local state.
          updateAuthUser(updatedUser);

          setSuccess("Profile updated successfully!");
          setIsEditing(false);
        } else {
          setSuccess("Profile saved successfully.");
          setIsEditing(false);
        }
      }

    } catch (err) {
      console.error("Profile update error:", err);
      // 🛡️ Shows the REAL error without crashing the page
      const errorMessage = err.response?.data?.message || err.message || "Failed to update profile.";
      setError(`Backend Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const errors = {};
      if (!passwordForm.currentPassword) errors.currentPassword = "Current password is required";
      if (!passwordForm.newPassword) errors.newPassword = "New password is required";
      if (passwordForm.newPassword.length < 6) errors.newPassword = "Password must be at least 6 characters";
      if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = "Passwords do not match";

      if (Object.keys(errors).length > 0) {
        setPasswordErrors(errors);
        return;
      }

      setSaving(true);
      const response = await api.put("/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        setSuccess("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordErrors({});
      }
    } catch (err) {
      console.error("Password change error:", err);
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div>
            <h1>Profile Settings</h1>
            <p className="subtitle">Manage your personal details</p>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                <Edit size={18} /> Edit Profile
              </button>
            ) : (
              <>
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setIsEditing(false);
                    setImagePreview(authUser?.profileImage || null);
                    setProfileImage(authUser?.profileImage || null);
                    setForm({
                      name: authUser?.name || "",
                      email: authUser?.email || "",
                      role: authUser?.role || "ADMIN",
                      expertise: authUser?.expertise || "",
                      bio: authUser?.bio || "",
                      socialLink: authUser?.social_links || authUser?.socialLink || "",
                    });
                    setError("");
                  }}
                >
                  <X size={18} /> Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <><Loader size={18} className="spinning" /> Saving...</> : <><Save size={18} /> Save Changes</>}
                </button>
              </>
            )}
          </div>
        </div>

        {success && <div className="alert alert-success"><CheckCircle size={18} /> {success}</div>}
        {error && <div className="alert alert-error"><AlertCircle size={18} /> {error}</div>}

        <div className="profile-grid">
          <div className="profile-image-section">
            <div className="profile-image-container">
              <div className="profile-image-wrapper">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" />
                ) : (
                  <div className="profile-image-placeholder"><span className="initials">{getInitials(form.name)}</span></div>
                )}
                {isEditing && (
                  <div className="profile-image-overlay">
                    <label className="upload-btn" htmlFor="profile-image-upload">
                      <Camera size={20} /> <span>Change Photo</span>
                    </label>
                    <input id="profile-image-upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: "none" }} />
                    {imagePreview && <button className="remove-image-btn" onClick={handleRemoveImage}><Trash2 size={16} /></button>}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-quick-actions" style={{ marginTop: "1.5rem", width: "100%" }}>
              <button className="quick-action-btn" onClick={() => setShowPasswordModal(true)}>
                <Lock size={16} /> Change Password
              </button>
            </div>
          </div>

          <div className="profile-details-section">
            <div className="details-card">
              <h3>Personal Information</h3>
              <div className="details-grid">
                <div className="detail-field">
                  <label><User size={16} /> Full Name</label>
                  {isEditing ? <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="Enter full name" /> : <p className="field-value">{form.name || "Not set"}</p>}
                </div>
                <div className="detail-field">
                  <label><Mail size={16} /> Email Address</label>
                  {isEditing ? <input type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="Enter email" /> : <p className="field-value">{form.email || "Not set"}</p>}
                </div>
                <div className="detail-field">
                  <label><Shield size={16} /> Role</label>
                  {isEditing ? <input type="text" name="role" value={form.role} onChange={handleInputChange} placeholder="Role" /> : <p className="field-value">{form.role || "Not set"}</p>}
                </div>
                <div className="detail-field">
                  <label><Award size={16} /> Expertise</label>
                  {isEditing ? <input type="text" name="expertise" value={form.expertise} onChange={handleInputChange} placeholder="e.g. React, Node.js" /> : <p className="field-value">{form.expertise || "Not set"}</p>}
                </div>
                <div className="detail-field">
                  <label><Globe size={16} /> Social Link</label>
                  {isEditing ? <input type="url" name="socialLink" value={form.socialLink} onChange={handleInputChange} placeholder="https://linkedin.com/in/..." /> : <p className="field-value">{form.socialLink ? <a href={form.socialLink} target="_blank" rel="noopener noreferrer">{form.socialLink}</a> : "Not set"}</p>}
                </div>
                <div className="detail-field full-width">
                  <label><User size={16} /> Bio</label>
                  {isEditing ? <textarea name="bio" value={form.bio} onChange={handleInputChange} placeholder="Tell us a little about yourself" rows={3} /> : <p className="field-value">{form.bio || "No bio provided"}</p>}
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
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password *</label>
                <div className="password-input-wrapper">
                  <input type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" value={passwordForm.currentPassword} onChange={(e) => { setPasswordForm({...passwordForm, currentPassword: e.target.value}); setPasswordErrors({...passwordErrors, currentPassword: ""}); }} className={passwordErrors.currentPassword ? "error" : ""} />
                  <button type="button" className="password-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {passwordErrors.currentPassword && <span className="error-text">{passwordErrors.currentPassword}</span>}
              </div>
              <div className="form-group">
                <label>New Password *</label>
                <div className="password-input-wrapper">
                  <input type={showNewPassword ? "text" : "password"} placeholder="Enter new password (min 6 characters)" value={passwordForm.newPassword} onChange={(e) => { setPasswordForm({...passwordForm, newPassword: e.target.value}); setPasswordErrors({...passwordErrors, newPassword: ""}); }} className={passwordErrors.newPassword ? "error" : ""} />
                  <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {passwordErrors.newPassword && <span className="error-text">{passwordErrors.newPassword}</span>}
              </div>
              <div className="form-group">
                <label>Confirm New Password *</label>
                <div className="password-input-wrapper">
                  <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={(e) => { setPasswordForm({...passwordForm, confirmPassword: e.target.value}); setPasswordErrors({...passwordErrors, confirmPassword: ""}); }} className={passwordErrors.confirmPassword ? "error" : ""} />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {passwordErrors.confirmPassword && <span className="error-text">{passwordErrors.confirmPassword}</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleChangePassword} disabled={saving}>
                {saving ? <><Loader size={18} className="spinning" /> Changing...</> : <><Lock size={18} /> Change Password</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfile;