// src/controllers/user.controller.js
const userService = require("../services/user.service");

// ==========================================
// Create User (Uses invitation flow)
// ==========================================
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: user.isActive ? "User created successfully" : "Invitation sent successfully! User will receive an email to set up their account.",
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
// Check Invitation Token (PUBLIC)
// ==========================================
exports.checkInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await userService.checkInvitation(token);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Invalid or expired invitation token"
    });
  }
};

// ==========================================
// Verify Invitation & Set Password (PUBLIC)
// ==========================================
exports.verifyInvitation = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const user = await userService.verifyInvitation(token, password);

    const jwt = require("jsonwebtoken");
    const authToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Account activated successfully!",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: authToken
      }
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Failed to verify invitation"
    });
  }
};

// ==========================================
// Resend Invitation (ADMIN only)
// ==========================================
exports.resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.resendInvitation(parseInt(id));

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Failed to resend invitation"
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

    if (req.path === '/update-profile' || !req.params.id) {
      userId = req.user.id;
    } else {
      userId = parseInt(req.params.id);
    }

    const updateData = { ...(req.body || {}) };

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
      message: result.message,
      data: result.deletedUser
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
    const user = req.user;
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
// Change Password (Self)
// ==========================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    const result = await userService.changePassword(userId, currentPassword, newPassword);

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