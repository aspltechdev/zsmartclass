// src/controllers/user.controller.js
const userService = require("../services/user.service");

// ==========================================
// Create User
// ==========================================
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Get All Users
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Get User By ID
// ==========================================
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(err.statusCode || 404).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Update User
// ==========================================
exports.updateUser = async (req, res) => {
  try {
    let userId;

    // If the request is coming from /update-profile (no ID in URL), use the logged-in user's ID
    if (req.path === '/update-profile' || !req.params.id) {
      userId = req.user.id;
    } else {
      userId = parseInt(req.params.id);
    }

    // multer parses multipart/form-data fields into req.body, but if a
    // request somehow reaches here with no body at all (e.g. wrong
    // Content-Type, no middleware ran), fall back to {} instead of
    // crashing the destructure in the service layer.
    const updateData = { ...(req.body || {}) };

    // If a new photo was uploaded, attach its public URL so it gets saved
    // on the user record alongside the text fields. We build a full
    // absolute URL (not just the path) because the frontend runs on a
    // different origin/port than this API — a relative path like
    // "/uploads/..." would resolve against the frontend's own origin and
    // 404 instead of pointing back at this server.
    if (req.file) {
      updateData.profileImage = `${req.protocol}://${req.get("host")}/uploads/profile-images/${req.file.filename}`;
    }

    const user = await userService.updateUser(userId, updateData);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Delete User
// ==========================================
exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Get Current User (Self)
// ==========================================
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user is already populated by your authMiddleware!
    const user = req.user;

    // Remove password before sending to frontend
    const { password, ...safeUser } = user;

    res.status(200).json({
      success: true,
      data: safeUser
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Toggle User Status
// ==========================================
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id);

    res.status(200).json({
      success: true,
      message: `User ${user.status === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      data: user
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Change User Role
// ==========================================
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required"
      });
    }

    const user = await userService.changeUserRole(req.params.id, role);

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Reset User Password (Admin)
// ==========================================
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required"
      });
    }

    const result = await userService.resetUserPassword(req.params.id, newPassword);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Bulk Import Users
// ==========================================
exports.bulkImportUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        message: "Users array is required"
      });
    }

    const result = await userService.bulkImportUsers(users);

    res.status(200).json({
      success: true,
      message: `Imported ${result.success.length} of ${result.total} users`,
      data: result
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Get Dashboard Stats
// ==========================================
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await userService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================================
// Search Users
// ==========================================
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const users = await userService.searchUsers(q);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};