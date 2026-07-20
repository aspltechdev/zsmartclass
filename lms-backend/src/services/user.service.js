// // src/services/user.service.js
// const prisma = require("../config/prisma");
// const bcrypt = require("bcryptjs");

// class UserService {
//   /**
//    * Create a new user (Admin only)
//    */
//   async createUser(userData) {
//     const { 
//       name, 
//       email, 
//       password, 
//       role = "STUDENT"
//     } = userData;

//     // Validate required fields
//     if (!name || !email || !password) {
//       const error = new Error("Name, email, and password are required");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       const error = new Error("Invalid email format");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Validate password strength
//     if (password.length < 8) {
//       const error = new Error("Password must be at least 8 characters");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Validate role
//     const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
//     if (!validRoles.includes(role)) {
//       const error = new Error("Invalid role. Must be ADMIN, MENTOR, or STUDENT");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Check if email already exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email: email.toLowerCase() }
//     });

//     if (existingUser) {
//       const error = new Error("Email already registered");
//       error.statusCode = 409;
//       throw error;
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create user
//     const user = await prisma.user.create({
//       data: {
//         name: name.trim(),
//         email: email.toLowerCase().trim(),
//         password: hashedPassword,
//         role,
//         emailVerified: true // Admin-created users are auto-verified
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         emailVerified: true,
//         createdAt: true,
//         updatedAt: true
//       }
//     });

//     return user;
//   }

//   /**
//    * Get all users with pagination, search, and filters
//    */
//   async getAllUsers(query = {}) {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       role,
//       status,
//       sortBy = "createdAt",
//       sortOrder = "desc"
//     } = query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const take = parseInt(limit);

//     // Build where clause
//     const where = {};

//     // Search by name or email
//     if (search) {
//       where.OR = [
//         { name: { contains: search, mode: 'insensitive' } },
//         { email: { contains: search, mode: 'insensitive' } }
//       ];
//     }

//     // Filter by role
//     if (role) {
//       where.role = role.toUpperCase();
//     }

//     // Filter by email verification status
//     if (status === "verified") {
//       where.emailVerified = true;
//     } else if (status === "unverified") {
//       where.emailVerified = false;
//     }

//     // Get total count and users in parallel
//     const [total, users] = await Promise.all([
//       prisma.user.count({ where }),
//       prisma.user.findMany({
//         where,
//         skip,
//         take,
//         orderBy: {
//           [sortBy]: sortOrder
//         },
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//           emailVerified: true,
//           createdAt: true,
//           updatedAt: true
//         }
//       })
//     ]);

//     return {
//       users,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         totalPages: Math.ceil(total / take),
//         hasMore: skip + users.length < total
//       }
//     };
//   }

//   /**
//    * Get user by ID
//    */
//   async getUserById(userId) {
//     const user = await prisma.user.findUnique({
//       where: { id: parseInt(userId) },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         emailVerified: true,
//         createdAt: true,
//         updatedAt: true,
//         _count: {
//           select: {
//             enrollments: true,
//             coursesCreated: true
//           }
//         }
//       }
//     });

//     if (!user) {
//       const error = new Error("User not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     return user;
//   }

//   /**
//    * Update user
//    */
//   async updateUser(userId, updateData) {
//     const { name, email, role } = updateData;

//     // Check if user exists
//     const existingUser = await prisma.user.findUnique({
//       where: { id: parseInt(userId) }
//     });

//     if (!existingUser) {
//       const error = new Error("User not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     // If email is being updated, check uniqueness
//     if (email && email !== existingUser.email) {
//       const emailExists = await prisma.user.findUnique({
//         where: { email: email.toLowerCase() }
//       });

//       if (emailExists) {
//         const error = new Error("Email already in use");
//         error.statusCode = 409;
//         throw error;
//       }
//     }

//     // If role is being updated, validate
//     if (role) {
//       const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
//       if (!validRoles.includes(role)) {
//         const error = new Error("Invalid role");
//         error.statusCode = 400;
//         throw error;
//       }
//     }

//     // Build update data
//     const data = {};
//     if (name) data.name = name.trim();
//     if (email) data.email = email.toLowerCase().trim();
//     if (role) data.role = role;

//     // Update user
//     const updatedUser = await prisma.user.update({
//       where: { id: parseInt(userId) },
//       data,
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         emailVerified: true,
//         createdAt: true,
//         updatedAt: true
//       }
//     });

//     return updatedUser;
//   }

//   /**
//    * Delete user
//    */
//   async deleteUser(userId) {
//     // Check if user exists
//     const user = await prisma.user.findUnique({
//       where: { id: parseInt(userId) },
//       include: {
//         coursesCreated: true,
//         enrollments: true
//       }
//     });

//     if (!user) {
//       const error = new Error("User not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Prevent deletion if user has active courses (for mentors)
//     if (user.coursesCreated.length > 0) {
//       const error = new Error(
//         "Cannot delete user with active courses. Please reassign or delete courses first."
//       );
//       error.statusCode = 400;
//       throw error;
//     }

//     // Delete user (cascading deletes will handle related records if configured)
//     await prisma.user.delete({
//       where: { id: parseInt(userId) }
//     });

//     return { message: "User deleted successfully" };
//   }

//   /**
//    * Toggle user active status
//    */
//   async toggleUserStatus(userId) {
//     // Check if user exists
//     const user = await prisma.user.findUnique({
//       where: { id: parseInt(userId) }
//     });

//     if (!user) {
//       const error = new Error("User not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Toggle emailVerified as active/inactive indicator
//     const updatedUser = await prisma.user.update({
//       where: { id: parseInt(userId) },
//       data: { 
//         emailVerified: !user.emailVerified 
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         emailVerified: true,
//         updatedAt: true
//       }
//     });

//     return {
//       ...updatedUser,
//       status: updatedUser.emailVerified ? "ACTIVE" : "INACTIVE"
//     };
//   }

//   /**
//    * Change user role
//    */
//   async changeUserRole(userId, newRole) {
//     // Check if user exists
//     const user = await prisma.user.findUnique({
//       where: { id: parseInt(userId) }
//     });

//     if (!user) {
//       const error = new Error("User not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Validate role
//     const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
//     if (!validRoles.includes(newRole)) {
//       const error = new Error("Invalid role. Must be ADMIN, MENTOR, or STUDENT");
//       error.statusCode = 400;
//       throw error;
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: parseInt(userId) },
//       data: { role: newRole },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         updatedAt: true
//       }
//     });

//     // Create notification for the user
//     await prisma.notification.create({
//       data: {
//         studentId: parseInt(userId),
//         title: "Role Updated",
//         message: `Your role has been updated to ${newRole}`,
//         type: "SYSTEM"
//       }
//     });

//     return updatedUser;
//   }

//   /**
//    * Reset user password (Admin only)
//    */
//   async resetUserPassword(userId, newPassword) {
//     // Check if user exists
//     const user = await prisma.user.findUnique({
//       where: { id: parseInt(userId) }
//     });

//     if (!user) {
//       const error = new Error("User not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Validate password strength
//     if (!newPassword || newPassword.length < 8) {
//       const error = new Error("Password must be at least 8 characters");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Hash new password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);

//     // Update password
//     await prisma.user.update({
//       where: { id: parseInt(userId) },
//       data: { password: hashedPassword }
//     });

//     // Create notification
//     await prisma.notification.create({
//       data: {
//         studentId: parseInt(userId),
//         title: "Password Reset",
//         message: "Your password has been reset by an administrator",
//         type: "SYSTEM"
//       }
//     });

//     return { message: "Password reset successfully" };
//   }

//   /**
//    * Get dashboard statistics
//    */
//   async getDashboardStats() {
//     const [
//       totalUsers,
//       totalStudents,
//       totalMentors,
//       totalAdmins,
//       newUsersToday,
//       newUsersThisWeek,
//       newUsersThisMonth,
//       verifiedUsers,
//       unverifiedUsers
//     ] = await Promise.all([
//       // Total users
//       prisma.user.count(),
      
//       // Users by role
//       prisma.user.count({ where: { role: "STUDENT" } }),
//       prisma.user.count({ where: { role: "MENTOR" } }),
//       prisma.user.count({ where: { role: "ADMIN" } }),
      
//       // New users today
//       prisma.user.count({
//         where: {
//           createdAt: {
//             gte: new Date(new Date().setHours(0, 0, 0, 0))
//           }
//         }
//       }),
      
//       // New users this week
//       prisma.user.count({
//         where: {
//           createdAt: {
//             gte: new Date(new Date().setDate(new Date().getDate() - 7))
//           }
//         }
//       }),
      
//       // New users this month
//       prisma.user.count({
//         where: {
//           createdAt: {
//             gte: new Date(new Date().setDate(new Date().getDate() - 30))
//           }
//         }
//       }),
      
//       // Email verification status
//       prisma.user.count({ where: { emailVerified: true } }),
//       prisma.user.count({ where: { emailVerified: false } })
//     ]);

//     // Get monthly user growth (last 6 months)
//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

//     const recentUsers = await prisma.user.findMany({
//       where: {
//         createdAt: {
//           gte: sixMonthsAgo
//         }
//       },
//       select: {
//         createdAt: true
//       },
//       orderBy: {
//         createdAt: 'asc'
//       }
//     });

//     // Group by month manually
//     const userGrowth = {};
//     recentUsers.forEach(user => {
//       const monthYear = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
//       userGrowth[monthYear] = (userGrowth[monthYear] || 0) + 1;
//     });

//     // Convert to array format
//     const growthData = Object.entries(userGrowth).map(([month, count]) => ({
//       month,
//       count
//     }));

//     // Role distribution
//     const roleDistribution = [
//       { role: "STUDENT", count: totalStudents },
//       { role: "MENTOR", count: totalMentors },
//       { role: "ADMIN", count: totalAdmins }
//     ];

//     return {
//       totals: {
//         users: totalUsers,
//         students: totalStudents,
//         mentors: totalMentors,
//         admins: totalAdmins
//       },
//       newUsers: {
//         today: newUsersToday,
//         thisWeek: newUsersThisWeek,
//         thisMonth: newUsersThisMonth
//       },
//       verification: {
//         verified: verifiedUsers,
//         unverified: unverifiedUsers,
//         verificationRate: totalUsers > 0 
//           ? Math.round((verifiedUsers / totalUsers) * 100) 
//           : 0
//       },
//       activeUsers: verifiedUsers,
//       inactiveUsers: unverifiedUsers,
//       roleDistribution,
//       userGrowth: growthData
//     };
//   }

//   /**
//    * Bulk import users
//    */
//   async bulkImportUsers(users) {
//     if (!Array.isArray(users) || users.length === 0) {
//       const error = new Error("Users array is required");
//       error.statusCode = 400;
//       throw error;
//     }

//     const results = {
//       success: [],
//       failed: [],
//       total: users.length
//     };

//     for (const userData of users) {
//       try {
//         const user = await this.createUser(userData);
//         results.success.push(user);
//       } catch (error) {
//         results.failed.push({
//           email: userData.email,
//           error: error.message
//         });
//       }
//     }

//     return results;
//   }

//   /**
//    * Get user by email
//    */
//   async getUserByEmail(email) {
//     const user = await prisma.user.findUnique({
//       where: { email: email.toLowerCase() }
//     });

//     return user;
//   }

//   /**
//    * Search users
//    */
//   async searchUsers(searchTerm) {
//     if (!searchTerm || searchTerm.length < 2) {
//       const error = new Error("Search term must be at least 2 characters");
//       error.statusCode = 400;
//       throw error;
//     }

//     const users = await prisma.user.findMany({
//       where: {
//         OR: [
//           { name: { contains: searchTerm, mode: 'insensitive' } },
//           { email: { contains: searchTerm, mode: 'insensitive' } }
//         ]
//       },
//       take: 20,
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         createdAt: true
//       },
//       orderBy: {
//         createdAt: 'desc'
//       }
//     });

//     return users;
//   }
// }

// module.exports = new UserService();


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
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed confusing chars
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789"; // Removed 0 and 1
    const symbols = "!@#$%&*";
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    // Ensure at least one of each type
    let password = "";
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];
    
    // Fill remaining with random chars
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
  }

  /**
   * Create a new user (Admin only)
   */
  async createUser(userData) {
    const { 
      name, 
      email, 
      password, 
      role = "STUDENT" 
    } = userData;

    // Validate required fields
    if (!name || !email) {
      const error = new Error("Name and email are required");
      error.statusCode = 400;
      throw error;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    // Validate role
    const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
    if (!validRoles.includes(role)) {
      const error = new Error("Invalid role. Must be ADMIN, MENTOR, or STUDENT");
      error.statusCode = 400;
      throw error;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      const error = new Error("Email already registered");
      error.statusCode = 409;
      throw error;
    }

    // Generate password if not provided
    const userPassword = password || this.generateRandomPassword();

    // Validate password strength (only if manually provided)
    if (password && password.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        emailVerified: true // Admin-created users are auto-verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Send welcome email (non-blocking)
    try {
      await emailService.sendWelcomeEmail(user, userPassword);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError.message);
      // Don't throw - user is created even if email fails
    }

    return {
      ...user,
      // Only show password in response if auto-generated
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

    // Build where clause
    const where = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by role
    if (role) {
      where.role = role.toUpperCase();
    }

    // Filter by email verification status
    if (status === "verified") {
      where.emailVerified = true;
    } else if (status === "unverified") {
      where.emailVerified = false;
    }

    // Get total count and users in parallel
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
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

    return {
      users,
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
        createdAt: true,
        updatedAt: true,
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

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    const { name, email, role } = updateData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // If email is being updated, check uniqueness
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

    // If role is being updated, validate
    if (role) {
      const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
      if (!validRoles.includes(role)) {
        const error = new Error("Invalid role");
        error.statusCode = 400;
        throw error;
      }
    }

    // Build update data
    const data = {};
    if (name) data.name = name.trim();
    if (email) data.email = email.toLowerCase().trim();
    if (role) data.role = role;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        coursesCreated: true,
        enrollments: true
      }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Prevent deletion if user has active courses (for mentors)
    if (user.coursesCreated.length > 0) {
      const error = new Error(
        "Cannot delete user with active courses. Please reassign or delete courses first."
      );
      error.statusCode = 400;
      throw error;
    }

    // Delete user (cascading deletes will handle related records if configured)
    await prisma.user.delete({
      where: { id: parseInt(userId) }
    });

    return { message: "User deleted successfully" };
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Toggle emailVerified as active/inactive indicator
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { 
        emailVerified: !user.emailVerified 
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    return {
      ...updatedUser,
      status: updatedUser.emailVerified ? "ACTIVE" : "INACTIVE"
    };
  }

  /**
   * Change user role
   */
  async changeUserRole(userId, newRole) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Validate role
    const validRoles = ["ADMIN", "MENTOR", "STUDENT"];
    if (!validRoles.includes(newRole)) {
      const error = new Error("Invalid role. Must be ADMIN, MENTOR, or STUDENT");
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

    // Create notification for the user
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
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Generate password if not provided
    const password = newPassword || this.generateRandomPassword();

    // Validate password strength (only if manually provided)
    if (newPassword && newPassword.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      throw error;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        studentId: parseInt(userId),
        title: "Password Reset",
        message: "Your password has been reset by an administrator",
        type: "SYSTEM"
      }
    });

    // Send password reset email (non-blocking)
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
      activeUsers: verifiedUsers,
      inactiveUsers: unverifiedUsers,
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
        const user = await this.createUser(userData);
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