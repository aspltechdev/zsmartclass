// src/services/user.service.js
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const emailService = require("./email.service");

class UserService {
  /**
   * Generate a secure random password
   */
  generateRandomPassword(length = 12) {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%&*";
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = "";
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }
    
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
  }

  /**
   * Generate invitation token
   */
  generateInvitationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * INVITE a new user - NO password set, user sets via invitation link
   */
  async inviteUser(userData) {
    const { 
      name, 
      email, 
      role = "STUDENT",
      invitedBy = null
    } = userData;

    if (!name || !email) {
      const error = new Error("Name and email are required");
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
    if (!validRoles.includes(role)) {
      const error = new Error("Invalid role. Must be ADMIN, MENTOR, or STUDENT");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      const error = new Error("Email already registered");
      error.statusCode = 409;
      throw error;
    }

    const invitationToken = this.generateInvitationToken();
    const invitationExpiry = new Date();
    invitationExpiry.setHours(invitationExpiry.getHours() + 48);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        emailVerified: false,
        isActive: false,
        invitationToken,
        invitationExpiry,
        invitedBy: invitedBy ? parseInt(invitedBy) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        invitationToken: true,
        invitationExpiry: true,
        createdAt: true,
        updatedAt: true
      }
    });

    try {
      await emailService.sendInvitationEmail(user, invitationToken);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError.message);
    }

    return user;
  }

  /**
   * Verify invitation and set password (PUBLIC)
   */
  async verifyInvitation(token, password) {
    if (!password || password.length < 6) {
      const error = new Error("Password must be at least 6 characters");
      error.statusCode = 400;
      throw error;
    }

    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationExpiry: {
          gt: new Date()
        },
        isActive: false,
      }
    });

    if (!user) {
      const error = new Error("Invalid or expired invitation token");
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
        invitationToken: null,
        invitationExpiry: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  /**
   * Check if invitation token is valid (PUBLIC)
   */
  async checkInvitation(token) {
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationExpiry: {
          gt: new Date()
        },
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        invitationExpiry: true,
      }
    });

    if (!user) {
      const error = new Error("Invalid or expired invitation token");
      error.statusCode = 400;
      throw error;
    }

    return user;
  }

  /**
   * Resend invitation email (ADMIN)
   */
  async resendInvitation(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (user.isActive) {
      const error = new Error("User is already active");
      error.statusCode = 400;
      throw error;
    }

    const invitationToken = this.generateInvitationToken();
    const invitationExpiry = new Date();
    invitationExpiry.setHours(invitationExpiry.getHours() + 48);

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        invitationToken,
        invitationExpiry,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    try {
      await emailService.sendInvitationEmail(updatedUser, invitationToken);
    } catch (emailError) {
      console.error("Failed to resend invitation email:", emailError.message);
      const error = new Error("Failed to send invitation email");
      error.statusCode = 500;
      throw error;
    }

    return { 
      message: "Invitation resent successfully",
      user: updatedUser
    };
  }

  /**
   * Create user - uses invitation flow by default
   */
  async createUser(userData) {
    if (userData.password) {
      return this._createUserWithPassword(userData);
    }
    return this.inviteUser(userData);
  }

  /**
   * Internal: Create user with password (legacy)
   */
  async _createUserWithPassword(userData) {
    const { name, email, password, role = "STUDENT" } = userData;

    if (!name || !email) {
      const error = new Error("Name and email are required");
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
    if (!validRoles.includes(role)) {
      const error = new Error("Invalid role");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      const error = new Error("Email already registered");
      error.statusCode = 409;
      throw error;
    }

    const userPassword = password || this.generateRandomPassword();

    if (password && password.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        emailVerified: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    try {
      await emailService.sendWelcomeEmail(user, userPassword);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError.message);
    }

    return {
      ...user,
      ...(password ? {} : { temporaryPassword: userPassword })
    };
  }

  /**
   * Get all users with pagination, search, and filters
   */
  async getAllUsers(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      status,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role.toUpperCase();
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "pending") {
      where.isActive = false;
    } else if (status === "verified") {
      where.emailVerified = true;
    } else if (status === "unverified") {
      where.emailVerified = false;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          isActive: true,
          invitationToken: true,
          invitationExpiry: true,
          invitedBy: true,
          createdAt: true,
          updatedAt: true,
          profileImage: true,
          expertise: true,
          bio: true,
          social_links: true,
          _count: {
            select: {
              enrollments: true,
              coursesCreated: true
            }
          }
        }
      })
    ]);

    const transformedUsers = users.map(user => ({
      ...user,
      status: user.isActive ? "ACTIVE" : "PENDING",
      invitationExpired: user.invitationExpiry ? new Date(user.invitationExpiry) < new Date() : false,
    }));

    return {
      users: transformedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / take),
        hasMore: skip + users.length < total
      }
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        invitationToken: true,
        invitationExpiry: true,
        invitedBy: true,
        createdAt: true,
        updatedAt: true,
        profileImage: true,
        expertise: true,
        bio: true,
        social_links: true,
        _count: {
          select: {
            enrollments: true,
            coursesCreated: true
          }
        }
      }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      ...user,
      status: user.isActive ? "ACTIVE" : "PENDING",
    };
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    const { name, email, role, expertise, bio, socialLink, profileImage } = updateData;

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (emailExists) {
        const error = new Error("Email already in use");
        error.statusCode = 409;
        throw error;
      }
    }

    if (role) {
      const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
      if (!validRoles.includes(role)) {
        const error = new Error("Invalid role");
        error.statusCode = 400;
        throw error;
      }
    }

    const data = {};
    if (name) data.name = name.trim();
    if (email) data.email = email.toLowerCase().trim();
    if (role) data.role = role;
    if (expertise !== undefined) data.expertise = expertise;
    if (bio !== undefined) data.bio = bio;
    if (socialLink !== undefined) data.social_links = socialLink;
    if (profileImage !== undefined) data.profileImage = profileImage;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        expertise: true,
        bio: true,
        social_links: true,
        profileImage: true,
      }
    });

    return updatedUser;
  }

  /**
   * Change user password (Self)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (!user.password) {
      const error = new Error("This account uses invitation-based login. Please use 'Forgot Password' to set a password.");
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error("Password must be at least 6 characters");
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword }
    });

    return { message: "Password changed successfully" };
  }

  /**
   * Delete user - Database CASCADE handles all related records automatically
   */
  async deleteUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    try {
      await prisma.user.delete({
        where: { id: parseInt(userId) }
      });

      return { 
        message: `User "${user.name}" deleted successfully. All related records have been automatically removed.`,
        deletedUser: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      };
    } catch (error) {
      console.error("Delete user error:", error);
      if (error.code === 'P2003') {
        throw new Error(
          "Cannot delete user due to foreign key constraints. " +
          "Please check if cascade delete is properly configured."
        );
      }
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { 
        isActive: !user.isActive,
        emailVerified: user.isActive ? user.emailVerified : false
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        updatedAt: true
      }
    });

    return {
      ...updatedUser,
      status: updatedUser.isActive ? "ACTIVE" : "INACTIVE"
    };
  }

  /**
   * Change user role
   */
  async changeUserRole(userId, newRole) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
    if (!validRoles.includes(newRole)) {
      const error = new Error("Invalid role");
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    await prisma.notification.create({
      data: {
        studentId: parseInt(userId),
        title: "Role Updated",
        message: `Your role has been updated to ${newRole}`,
        type: "SYSTEM"
      }
    });

    return updatedUser;
  }

  /**
   * Reset user password (Admin only)
   */
  async resetUserPassword(userId, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const password = newPassword || this.generateRandomPassword();

    if (newPassword && newPassword.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword }
    });

    await prisma.notification.create({
      data: {
        studentId: parseInt(userId),
        title: "Password Reset",
        message: "Your password has been reset by an administrator",
        type: "SYSTEM"
      }
    });

    try {
      await emailService.sendPasswordResetEmail(user, password);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError.message);
    }

    return { 
      message: "Password reset successfully",
      ...(newPassword ? {} : { temporaryPassword: password })
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalStudents,
      totalMentors,
      totalAdmins,
      activeUsers,
      pendingUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      verifiedUsers,
      unverifiedUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "MENTOR" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { emailVerified: false } })
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const userGrowth = {};
    recentUsers.forEach(user => {
      const monthYear = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
      userGrowth[monthYear] = (userGrowth[monthYear] || 0) + 1;
    });

    const growthData = Object.entries(userGrowth).map(([month, count]) => ({
      month,
      count
    }));

    const roleDistribution = [
      { role: "STUDENT", count: totalStudents },
      { role: "MENTOR", count: totalMentors },
      { role: "ADMIN", count: totalAdmins }
    ];

    return {
      totals: {
        users: totalUsers,
        students: totalStudents,
        mentors: totalMentors,
        admins: totalAdmins
      },
      newUsers: {
        today: newUsersToday,
        thisWeek: newUsersThisWeek,
        thisMonth: newUsersThisMonth
      },
      verification: {
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        verificationRate: totalUsers > 0 
          ? Math.round((verifiedUsers / totalUsers) * 100) 
          : 0
      },
      activeUsers,
      pendingUsers,
      roleDistribution,
      userGrowth: growthData
    };
  }

  /**
   * Bulk import users
   */
  async bulkImportUsers(users) {
    if (!Array.isArray(users) || users.length === 0) {
      const error = new Error("Users array is required");
      error.statusCode = 400;
      throw error;
    }

    const results = {
      success: [],
      failed: [],
      total: users.length
    };

    for (const userData of users) {
      try {
        const user = await this.inviteUser(userData);
        results.success.push(user);
      } catch (error) {
        results.failed.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    return user;
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      const error = new Error("Search term must be at least 2 characters");
      error.statusCode = 400;
      throw error;
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users;
  }
}

module.exports = new UserService();