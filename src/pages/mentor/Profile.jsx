import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Pencil, X, Save } from "lucide-react";
import "./Profile.css";

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    bio: "",
    expertise: [],
    linkedin: "",
    github: "",
    portfolio: "",
    website: "",
    profilePhoto: "",
  });

  const [editProfile, setEditProfile] = useState({
    name: "",
    email: "",
    role: "",
    bio: "",
    expertise: [],
    linkedin: "",
    github: "",
    portfolio: "",
    website: "",
    profilePhoto: "",
  });

  const [expertiseInput, setExpertiseInput] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await api.get("/profile");

      const data = res.data.data;

      setProfile({
        name: data.name || "",
        email: data.email || "",
        role: data.role || "",
        bio: data.bio || "",
        expertise: data.expertise || [],
        linkedin: data.linkedin || "",
        github: data.github || "",
        portfolio: data.portfolio || "",
        website: data.website || "",
        profilePhoto: data.profilePhoto || "",
      });

      setExpertiseInput((data.expertise || []).join(", "));
    } catch (err) {
      console.error(err);
      alert("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const { updateUser } = useAuth();

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("thumbnail", file);

      const res = await api.post("/upload/thumbnail", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = res.data.url;

      const payload = {
        ...editProfile,
        profilePhoto: imageUrl,
        expertise: expertiseInput
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await api.put("/profile", payload);
      setEditProfile(response.data.data);
      setProfile(response.data.data);
      updateUser(response.data.data);
      alert("Profile photo updated successfully.");
    } catch (err) {
      console.error("Upload Error:", err.response?.data || err);
      alert(err.response?.data?.message || "Image upload failed.");
    }
  };

  const handleEditClick = () => {
    setEditProfile({
      name: profile.name || "",
      email: profile.email || "",
      role: profile.role || "",
      bio: profile.bio || "",
      expertise: profile.expertise || [],
      linkedin: profile.linkedin || "",
      github: profile.github || "",
      portfolio: profile.portfolio || "",
      website: profile.website || "",
      profilePhoto: profile.profilePhoto || "",
    });
    setExpertiseInput((profile.expertise || []).join(", "));
    setShowEditPopup(true);
  };

  const handleEditChange = (e) => {
    setEditProfile({
      ...editProfile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...editProfile,
        expertise: expertiseInput
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const res = await api.put("/profile", payload);

      setProfile(res.data.data);
      setEditProfile(res.data.data);
      updateUser(res.data.data);
      setShowEditPopup(false);
      alert("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading Profile...</div>;
  }

  return (
    <div className="profile-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-card"
      >
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {profile.profilePhoto ? (
                <img
                  src={`http://localhost:5000${profile.profilePhoto}`}
                  alt="Profile"
                />
              ) : (
                <div className="avatar-placeholder">
                  {profile.name?.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="profile-header-info">
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
            <span className="role-badge">{profile.role}</span>
          </div>
        </div>

        {/* Profile Information Display */}
        <div className="profile-display">
          <div className="profile-info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <p>{profile.name}</p>
            </div>

            <div className="info-item">
              <label>Email</label>
              <p>{profile.email}</p>
            </div>

            <div className="info-item full-width">
              <label>Bio</label>
              <p className="bio-text">{profile.bio || "No bio added yet."}</p>
            </div>

            <div className="info-item full-width">
              <label>Expertise</label>
              <div className="expertise-tags">
                {profile.expertise && profile.expertise.length > 0 ? (
                  profile.expertise.map((skill, index) => (
                    <span key={index} className="expertise-tag">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="no-data">No expertise added yet.</p>
                )}
              </div>
            </div>

            <div className="info-item">
              <label>LinkedIn</label>
              <p>
                {profile.linkedin ? (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-link"
                  >
                    {profile.linkedin}
                  </a>
                ) : (
                  <span className="no-data">Not added</span>
                )}
              </p>
            </div>

            <div className="info-item">
              <label>GitHub</label>
              <p>
                {profile.github ? (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-link"
                  >
                    {profile.github}
                  </a>
                ) : (
                  <span className="no-data">Not added</span>
                )}
              </p>
            </div>

            <div className="info-item">
              <label>Portfolio</label>
              <p>
                {profile.portfolio ? (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-link"
                  >
                    {profile.portfolio}
                  </a>
                ) : (
                  <span className="no-data">Not added</span>
                )}
              </p>
            </div>

            <div className="info-item">
              <label>Website</label>
              <p>
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-link"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <span className="no-data">Not added</span>
                )}
              </p>
            </div>
          </div>

          {/* Edit Button at Bottom */}
          <div className="profile-actions">
            <button className="edit-profile-btn" onClick={handleEditClick}>
              <Pencil size={18} />
              Edit Profile
            </button>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile Popup */}
      {showEditPopup && (
        <div className="popup-overlay" onClick={() => setShowEditPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Edit Profile</h2>
              <button
                className="popup-close-btn"
                onClick={() => setShowEditPopup(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="popup-body">
              {/* Avatar Upload in Popup */}
              <div className="popup-avatar-section">
                <div
                  className="popup-avatar"
                  onClick={() => document.getElementById("popup-profile-upload").click()}
                >
                  {editProfile.profilePhoto ? (
                    <img
                      src={`http://localhost:5000${editProfile.profilePhoto}`}
                      alt="Profile"
                    />
                  ) : (
                    <div className="popup-avatar-placeholder">
                      {editProfile.name?.charAt(0)}
                    </div>
                  )}
                  <div className="popup-avatar-overlay">
                    <Pencil size={16} />
                    Change Photo
                  </div>
                </div>
                <input
                  id="popup-profile-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleProfileUpload}
                />
              </div>

              <div className="popup-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editProfile.name}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editProfile.email}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea
                    rows={4}
                    name="bio"
                    value={editProfile.bio}
                    onChange={handleEditChange}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Expertise</label>
                  <input
                    type="text"
                    placeholder="React, Node.js, MongoDB"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                  />
                  <small>Separate multiple skills with commas.</small>
                </div>

                <div className="form-group">
                  <label>LinkedIn</label>
                  <input
                    type="text"
                    name="linkedin"
                    value={editProfile.linkedin}
                    onChange={handleEditChange}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="form-group">
                  <label>GitHub</label>
                  <input
                    type="text"
                    name="github"
                    value={editProfile.github}
                    onChange={handleEditChange}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="form-group">
                  <label>Portfolio</label>
                  <input
                    type="text"
                    name="portfolio"
                    value={editProfile.portfolio}
                    onChange={handleEditChange}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="text"
                    name="website"
                    value={editProfile.website}
                    onChange={handleEditChange}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <div className="popup-footer">
              <button
                className="popup-cancel-btn"
                onClick={() => setShowEditPopup(false)}
              >
                Cancel
              </button>
              <button
                className="popup-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;