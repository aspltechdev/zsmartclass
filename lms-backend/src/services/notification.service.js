// src/services/notification.service.js
const prisma = require("../config/prisma");

class NotificationService {
  // ============================================================
  // Resolve recipient user ids for a target audience
  //   audience: ALL | STUDENTS | MENTORS | ROLE | COURSE | USER
  // ============================================================
  async _resolveRecipients({ audience, courseId, role, userId }) {
    const a = String(audience || "ALL").toUpperCase();

    if (a === "USER") {
      return userId ? [Number(userId)] : [];
    }

    if (a === "COURSE") {
      if (!courseId) return [];
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: Number(courseId) },
        select: { userId: true }
      });
      return [...new Set(enrollments.map((e) => e.userId))];
    }

    if (a === "ROLE") {
      if (!role) return [];
      const users = await prisma.user.findMany({
        where: { role: String(role).toUpperCase() },
        select: { id: true }
      });
      return users.map((u) => u.id);
    }

    if (a === "STUDENTS" || a === "MENTORS" || a === "ADMINS") {
      const map = { STUDENTS: "STUDENT", MENTORS: "MENTOR", ADMINS: "ADMIN" };
      const users = await prisma.user.findMany({
        where: { role: map[a] },
        select: { id: true }
      });
      return users.map((u) => u.id);
    }

    // ALL
    const users = await prisma.user.findMany({ select: { id: true } });
    return users.map((u) => u.id);
  }

  // ============================================================
  // ADMIN: send to an audience (broadcast / course / role / user)
  // ============================================================
  async sendNotification(payload) {
    const { title, message, channel, audience, courseId, role, userId } = payload;

    if (!title || !String(title).trim()) {
      const err = new Error("Title is required.");
      err.statusCode = 400;
      throw err;
    }
    if (!message || !String(message).trim()) {
      const err = new Error("Message is required.");
      err.statusCode = 400;
      throw err;
    }

    const type = (channel && String(channel).trim()) || "GENERAL";

    const recipientIds = await this._resolveRecipients({
      audience,
      courseId,
      role,
      userId
    });

    if (recipientIds.length === 0) {
      const err = new Error("No recipients matched this audience.");
      err.statusCode = 400;
      throw err;
    }

    await prisma.notification.createMany({
      data: recipientIds.map((studentId) => ({
        studentId,
        title: String(title).trim(),
        message: String(message).trim(),
        type
      }))
    });

    return { recipients: recipientIds.length, channel: type };
  }

  // ============================================================
  // Single create (used by other services: payments, certificates…)
  // ============================================================
  async create(data) {
    const { studentId, title, message, type } = data;
    return await prisma.notification.create({
      data: {
        studentId: Number(studentId),
        title,
        message,
        type: type || "GENERAL"
      }
    });
  }

  // ============================================================
  // USER: my notifications
  // ============================================================
  async getMyNotifications(studentId) {
    return await prisma.notification.findMany({
      where: { studentId: Number(studentId) },
      orderBy: { createdAt: "desc" }
    });
  }

  async markAsRead(id, studentId) {
    const notification = await prisma.notification.findUnique({
      where: { id: Number(id) },
      select: { studentId: true }
    });
    if (!notification) {
      const err = new Error("Notification not found.");
      err.statusCode = 404;
      throw err;
    }
    // Ownership check — a user may only mark their own notification.
    if (notification.studentId !== Number(studentId)) {
      const err = new Error("Not authorized.");
      err.statusCode = 403;
      throw err;
    }
    return await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true }
    });
  }

  async markAllRead(studentId) {
    await prisma.notification.updateMany({
      where: { studentId: Number(studentId), isRead: false },
      data: { isRead: true }
    });
    return { success: true };
  }

  // ============================================================
  // ADMIN: grouped sent history
  // One entry per broadcast (same channel+title+message sent together),
  // with recipient and read counts.
  // ============================================================
  async getAllNotifications() {
    const rows = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" }
    });

    const groups = new Map();
    for (const n of rows) {
      const minute = new Date(n.createdAt);
      minute.setSeconds(0, 0);
      const key = `${n.type}||${n.title}||${n.message}||${minute.getTime()}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          channel: n.type,
          title: n.title,
          message: n.message,
          sentAt: n.createdAt,
          recipientCount: 0,
          readCount: 0,
          ids: []
        });
      }
      const g = groups.get(key);
      g.recipientCount += 1;
      if (n.isRead) g.readCount += 1;
      g.ids.push(n.id);
    }

    return Array.from(groups.values());
  }

  // ============================================================
  // Delete
  // ============================================================
  async deleteNotification(id, user) {
    const notification = await prisma.notification.findUnique({
      where: { id: Number(id) },
      select: { studentId: true }
    });
    if (!notification) {
      const err = new Error("Notification not found.");
      err.statusCode = 404;
      throw err;
    }
    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin && notification.studentId !== Number(user?.id)) {
      const err = new Error("Not authorized.");
      err.statusCode = 403;
      throw err;
    }
    await prisma.notification.delete({ where: { id: Number(id) } });
    return { success: true, message: "Notification deleted." };
  }

  // ADMIN: delete a whole broadcast group by its row ids
  async deleteBatch(ids) {
    const list = Array.isArray(ids) ? ids.map(Number).filter(Number.isInteger) : [];
    if (list.length === 0) {
      const err = new Error("No notification ids provided.");
      err.statusCode = 400;
      throw err;
    }
    const result = await prisma.notification.deleteMany({
      where: { id: { in: list } }
    });
    return { success: true, deleted: result.count };
  }
}

module.exports = new NotificationService();