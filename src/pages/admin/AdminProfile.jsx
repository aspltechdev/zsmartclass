import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Lock,
  Eye,
  EyeOff,
  CalendarDays,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "./AdminProfile.css";

function AdminProfile() {
  const navigate = useNavigate();

  const {
    user: authUser,
    updateUser,
    logout,
  } = useAuth();

  const fileInputRef = useRef(null);

  /* =========================================================
     STATES
  ========================================================= */

  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");

  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [profileImage, setProfileImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "ADMIN",
    bio: "",
  });

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [passwordErrors, setPasswordErrors] =
    useState({});

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* =========================================================
     LOAD USER
  ========================================================= */

  useEffect(() => {
    if (!authUser) return;

    setForm({
      name: authUser.name || "",
      email: authUser.email || "",
      role: authUser.role || "ADMIN",
      bio: authUser.bio || "",
    });

    setProfileImage(
      authUser.profileImage || null
    );

    setImagePreview(
      authUser.profileImage || null
    );
  }, [authUser]);

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleInputChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError(
        "Please upload a valid image file."
      );

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size should be less than 5MB."
      );

      e.target.value = "";
      return;
    }

    setProfileImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSuccess("");
    setError("");
  };

  /* =========================================================
     VALIDATE PROFILE
  ========================================================= */

  const validateProfile = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name =
        "Name is required.";
    }

    if (!form.email.trim()) {
      errors.email =
        "Email is required.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      errors.email =
        "Please enter a valid email address.";
    }

    return errors;
  };

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");

    const validationErrors =
      validateProfile();

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setError(
        Object.values(validationErrors)[0]
      );

      return;
    }

    try {
      setSaving(true);

      const formData =
        new FormData();

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "email",
        form.email.trim()
      );

      formData.append(
        "role",
        "ADMIN"
      );

      formData.append(
        "bio",
        form.bio || ""
      );

      if (profileImage instanceof File) {
        formData.append(
          "profileImage",
          profileImage
        );
      }

      const response =
        await api.put(
          "/users/update-profile",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      if (
        response.status === 200 ||
        response.status === 201
      ) {
        const returnedData =
          response.data;

        let updatedUser =
          returnedData?.data ||
          returnedData?.user ||
          returnedData;

        if (
          Array.isArray(updatedUser)
        ) {
          updatedUser =
            updatedUser[0];
        }

        if (
          updatedUser &&
          typeof updatedUser === "object"
        ) {
          const returnedProfileImage =
            updatedUser.profileImage ||
            updatedUser.profile_image ||
            updatedUser.profilePicture ||
            updatedUser.profile_picture ||
            updatedUser.avatar ||
            updatedUser.image ||
            null;

          const finalUser = {
            ...authUser,
            ...updatedUser,
            role: "ADMIN",
            profileImage:
              returnedProfileImage ||
              authUser?.profileImage ||
              null,
          };

          setForm({
            name:
              finalUser.name || "",
            email:
              finalUser.email || "",
            role: "ADMIN",
            bio:
              finalUser.bio || "",
          });

          if (returnedProfileImage) {
            setImagePreview(
              returnedProfileImage
            );

            setProfileImage(
              returnedProfileImage
            );
          }

          if (
            typeof updateUser === "function"
          ) {
            updateUser(finalUser);
          }

          setSuccess(
            "Profile updated successfully!"
          );

          setIsEditing(false);
        } else {
          setSuccess(
            "Profile saved successfully."
          );

          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error(
        "Admin profile update error:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CANCEL EDIT
  ========================================================= */

  const handleCancelEdit = () => {
    setIsEditing(false);

    setForm({
      name: authUser?.name || "",
      email: authUser?.email || "",
      role:
        authUser?.role || "ADMIN",
      bio: authUser?.bio || "",
    });

    setProfileImage(
      authUser?.profileImage || null
    );

    setImagePreview(
      authUser?.profileImage || null
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setError("");
    setSuccess("");
  };

  /* =========================================================
     PASSWORD INPUT
  ========================================================= */

  const handlePasswordChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPasswordErrors({});
    setError("");
  };

  /* =========================================================
     CHANGE PASSWORD
  ========================================================= */

  const handleChangePassword = async () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword =
        "Current password is required.";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword =
        "New password is required.";
    } else if (
      passwordForm.newPassword.length < 6
    ) {
      errors.newPassword =
        "Password must be at least 6 characters.";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword =
        "Please confirm your new password.";
    } else if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      errors.confirmPassword =
        "Passwords do not match.";
    }

    if (
      Object.keys(errors).length > 0
    ) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setPasswordErrors({});

      const response =
        await api.put(
          "/users/change-password",
          {
            currentPassword:
              passwordForm.currentPassword,

            newPassword:
              passwordForm.newPassword,
          }
        );

      if (
        response.data?.success ||
        response.status === 200
      ) {
        setSuccess(
          "Password changed successfully!"
        );

        setShowPasswordModal(false);

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error(
        "Admin password change error:",
        err
      );

      setPasswordErrors({
        submit:
          err.response?.data?.message ||
          "Failed to change password.",
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     INITIALS
  ========================================================= */

  const getInitials = (name) => {
    if (!name) return "A";

    return name
      .split(" ")
      .filter(Boolean)
      .map(
        (word) => word[0]
      )
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /* =========================================================
     JOINED DATE
  ========================================================= */

  const joinedLabel =
    authUser?.createdAt
      ? new Date(
          authUser.createdAt
        ).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        )
      : "—";

  /* =========================================================
     IMAGE URL
  ========================================================= */

  const getImageUrl = (image) => {
    if (!image) return null;

    const value =
      String(image).trim();

    if (!value) return null;

    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("blob:") ||
      value.startsWith("data:image/")
    ) {
      return value;
    }

    const API_URL =
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";

    if (value.startsWith("/")) {
      return `${API_URL.replace(
        /\/$/,
        ""
      )}${value}`;
    }

    return `${API_URL.replace(
      /\/$/,
      ""
    )}/${value}`;
  };

  const finalImageUrl =
    getImageUrl(imagePreview);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    if (typeof logout === "function") {
      logout();
    }

    navigate("/login", {
      replace: true,
    });
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="admin-profile-page">

      <div className="admin-profile-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="admin-profile-header">

          <div className="admin-profile-heading">

            <div className="admin-profile-heading-icon">
              <User size={26} />
            </div>

            <div>
              <h1>My Profile</h1>

              <p className="admin-subtitle">
                Manage your personal details
              </p>
            </div>

          </div>

          <div className="admin-profile-actions">

            {!isEditing ? (
              <button
                className="admin-btn-primary"
                onClick={() => {
                  setIsEditing(true);
                  setSuccess("");
                  setError("");
                }}
              >
                <User size={18} />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  className="admin-btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X size={18} />
                  Cancel
                </button>

                <button
                  className="admin-btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader
                        size={18}
                        className="admin-spinning"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}

          </div>

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {success && (
          <div className="admin-alert admin-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* =================================================
            PROFILE HERO
        ================================================= */}

        <div className="admin-profile-grid">

          <div className="admin-profile-image-section">

            <div className="admin-profile-image-container">

              <div className="admin-profile-image-wrapper">

                {finalImageUrl ? (
                  <img
                    src={finalImageUrl}
                    alt="Admin Profile"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="admin-profile-image-placeholder">
                    <span className="admin-initials">
                      {getInitials(form.name)}
                    </span>
                  </div>
                )}

                {isEditing && (
                  <div className="admin-profile-image-overlay">

                    <label
                      className="admin-upload-btn"
                      htmlFor="admin-profile-image-upload"
                    >
                      <Camera size={20} />
                      <span>Change Photo</span>
                    </label>

                    <input
                      id="admin-profile-image-upload"
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={
                        handleImageUpload
                      }
                    />

                    {imagePreview && (
                      <button
                        type="button"
                        className="admin-remove-image-btn"
                        onClick={
                          handleRemoveImage
                        }
                        title="Remove photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                  </div>
                )}

              </div>

              {/* IDENTITY */}

              <div className="admin-profile-identity">

                <h2 className="admin-profile-name">
                  {form.name || "Admin"}
                </h2>

                <span className="admin-profile-role-badge">
                  <Shield size={13} />
                  Administrator
                </span>

                <span className="admin-profile-joined">
                  <CalendarDays size={13} />
                  Joined {joinedLabel}
                </span>

              </div>

            </div>

            {/* QUICK ACTIONS */}

            <div className="admin-profile-quick-actions">

              <button
                className="admin-quick-action-btn"
                onClick={() =>
                  setShowPasswordModal(true)
                }
              >
                <Lock size={16} />
                Change Password
              </button>

              <button
                className="admin-quick-action-btn"
                onClick={() =>
                  navigate("/admin/dashboard")
                }
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>

              <button
                className="admin-quick-action-btn admin-danger-action"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>

            </div>

          </div>

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <div className="admin-profile-details-section">

            <div className="admin-details-card">

              <h3>
                <User size={18} />
                Personal Information
              </h3>

              <div className="admin-details-grid">

                {/* NAME */}

                <div className="admin-detail-field">

                  <label>
                    Full Name
                  </label>

                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="admin-field-value">
                      {form.name ||
                        "Not provided"}
                    </div>
                  )}

                </div>

                {/* EMAIL */}

                <div className="admin-detail-field">

                  <label>
                    <Mail size={14} />
                    Email Address
                  </label>

                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="admin-field-value">
                      {form.email ||
                        "Not provided"}
                    </div>
                  )}

                </div>

                {/* ROLE */}

                <div className="admin-detail-field">

                  <label>
                    Role
                  </label>

                  <div className="admin-field-value admin-role-value">
                    <Shield size={14} />
                    Administrator
                  </div>

                </div>

                {/* BIO */}

                <div className="admin-detail-field admin-full-width">

                  <label>
                    About Me
                  </label>

                  {isEditing ? (
                    <textarea
                      name="bio"
                      rows={5}
                      value={form.bio}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Tell us a little about yourself..."
                    />
                  ) : (
                    <div className="admin-field-value admin-bio-value">
                      {form.bio ||
                        "No bio added yet."}
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      {showPasswordModal && (
        <div
          className="admin-modal-overlay"
          onClick={() =>
            !saving &&
            setShowPasswordModal(false)
          }
        >

          <div
            className="admin-password-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="admin-modal-header">

              <div>
                <h2>
                  Change Password
                </h2>

                <p>
                  Update your account password
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  !saving &&
                  setShowPasswordModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="admin-modal-body">

              {passwordErrors.submit && (
                <div className="admin-password-error">
                  <AlertCircle size={16} />
                  {passwordErrors.submit}
                </div>
              )}

              {/* CURRENT PASSWORD */}

              <div className="admin-password-field">

                <label>
                  Current Password
                </label>

                <div className="admin-password-input">

                  <input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    name="currentPassword"
                    value={
                      passwordForm.currentPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter current password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (prev) => !prev
                      )
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

                {passwordErrors.currentPassword && (
                  <span className="admin-field-error">
                    {
                      passwordErrors.currentPassword
                    }
                  </span>
                )}

              </div>

              {/* NEW PASSWORD */}

              <div className="admin-password-field">

                <label>
                  New Password
                </label>

                <div className="admin-password-input">

                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    name="newPassword"
                    value={
                      passwordForm.newPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter new password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (prev) => !prev
                      )
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

                {passwordErrors.newPassword && (
                  <span className="admin-field-error">
                    {
                      passwordErrors.newPassword
                    }
                  </span>
                )}

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="admin-password-field">

                <label>
                  Confirm New Password
                </label>

                <div className="admin-password-input">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={
                      passwordForm.confirmPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Confirm new password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

                {passwordErrors.confirmPassword && (
                  <span className="admin-field-error">
                    {
                      passwordErrors.confirmPassword
                    }
                  </span>
                )}

              </div>

            </div>

            <div className="admin-modal-footer">

              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() =>
                  setShowPasswordModal(false)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-btn-primary"
                onClick={
                  handleChangePassword
                }
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader
                      size={17}
                      className="admin-spinning"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock size={17} />
                    Update Password
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminProfile;