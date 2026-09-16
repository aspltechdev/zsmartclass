const { randomUUID } = require("crypto");
const prisma = require("../config/prisma");

const PERSON_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true
};

const ROLES = new Set(["ADMIN", "MENTOR", "STUDENT"]);

const TYPES = new Set([
  "ANNOUNCEMENT",
  "NEW_ARRIVAL",
  "PROGRESS",
  "EVENT",
  "GENERAL",
  "SUCCESS",
  "WARNING",
  "ERROR",
  "PAYMENT",
  "CERTIFICATE",
  "ENROLLMENT",
  "SYSTEM"
]);

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function positiveId(value, label = "ID") {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    fail(`Invalid ${label}.`);
  }

  return id;
}

function requiredText(value, label, maximum) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${label} is required.`);
  }

  const text = value.trim();

  if (text.length > maximum) {
    fail(`${label} must be ${maximum} characters or fewer.`);
  }

  return text;
}

function systemSender() {
  return {
    id: null,
    name: "ZmartClass",
    email: null,
    role: "SYSTEM"
  };
}

function getSender(row) {
  if (row.sender) return row.sender;
  if (row.source === "SYSTEM") return systemSender();

  return {
    id: null,
    name: "Sender not recorded",
    email: null,
    role: null
  };
}

function getReceiver(row) {
  return row.receiver || row.student;
}

class NotificationService {
  async _requireAdmin(actor) {
    if (!actor?.id) {
      fail("Please sign in again.", 401);
    }

    const admin = await prisma.user.findUnique({
      where: {
        id: positiveId(actor.id, "sender ID")
      },
      select: PERSON_SELECT
    });

    if (!admin || admin.role !== "ADMIN") {
      fail("Only administrators can perform this action.", 403);
    }

    return admin;
  }

  async _resolveRecipients(payload, senderId) {
    const audience = String(payload.audience || "").toUpperCase();

    if (audience === "USER") {
      const receiverId = positiveId(payload.userId, "receiver ID");

      if (receiverId === senderId) {
        fail("You cannot send a notification to yourself.");
      }

      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: PERSON_SELECT
      });

      if (!receiver) {
        fail("Selected receiver was not found.", 404);
      }

      return {
        audience: "USER",
        label: `Single user: ${receiver.name}`,
        users: [receiver]
      };
    }

    if (audience === "COURSE") {
      const courseId = positiveId(payload.courseId, "course ID");

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true
        }
      });

      if (!course) {
        fail("Selected course was not found.", 404);
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { userId: true }
      });

      const ids = [
        ...new Set(
          enrollments
            .map((item) => item.userId)
            .filter((id) => id !== senderId)
        )
      ];

      const users = await prisma.user.findMany({
        where: {
          id: { in: ids },
          role: "STUDENT"
        },
        select: PERSON_SELECT
      });

      return {
        audience: "COURSE",
        label: `Course students: ${course.title}`,
        users
      };
    }

    const aliases = {
      STUDENTS: "STUDENT",
      MENTORS: "MENTOR",
      ADMINS: "ADMIN"
    };

    if (audience === "ROLE" || aliases[audience]) {
      const role =
        aliases[audience] ||
        String(payload.role || "").toUpperCase();

      if (!ROLES.has(role)) {
        fail("Select a valid receiver role.");
      }

      const users = await prisma.user.findMany({
        where: {
          role,
          id: { not: senderId }
        },
        select: PERSON_SELECT
      });

      return {
        audience: "ROLE",
        label:
          role === "ADMIN"
            ? "Other administrators"
            : `All ${role.toLowerCase()}s`,
        users
      };
    }

    if (audience === "ALL") {
      const users = await prisma.user.findMany({
        where: {
          id: { not: senderId }
        },
        select: PERSON_SELECT
      });

      return {
        audience: "ALL",
        label: "All users except sender",
        users
      };
    }

    fail("Select a valid audience.");
  }

  async sendNotification(payload, actor) {
    const sender = await this._requireAdmin(actor);

    const title = requiredText(payload.title, "Title", 200);
    const message = requiredText(payload.message, "Message", 5000);
    const type = String(payload.channel || "GENERAL").toUpperCase();

    if (!TYPES.has(type)) {
      fail("Select a valid notification type.");
    }

    const target = await this._resolveRecipients(payload, sender.id);

    if (!target.users.length) {
      fail(
        "No other users matched this audience. " +
        "You cannot send a notification to yourself."
      );
    }

    const batchId = randomUUID();
    const createdAt = new Date();

    const result = await prisma.notification.createMany({
      data: target.users.map((receiver) => ({
        studentId: receiver.id,
        title,
        message,
        type,
        batchId,
        source: "USER",
        sender,
        receiver,
        audience: target.audience,
        audienceLabel: target.label,
        createdAt
      }))
    });

    return {
      batchId,
      recipients: result.count,
      channel: type,
      audienceLabel: target.label,
      sender
    };
  }

  // Internal calls without an actor create automated notifications.
  // Admin HTTP requests pass their authenticated actor.
  async create(data, actor = null) {
    const receiverId = positiveId(data.studentId, "receiver ID");

    const sender = actor
      ? await this._requireAdmin(actor)
      : systemSender();

    if (actor && receiverId === sender.id) {
      fail("You cannot send a notification to yourself.");
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: PERSON_SELECT
    });

    if (!receiver) {
      fail("Receiver not found.", 404);
    }

    return prisma.notification.create({
      data: {
        studentId: receiver.id,
        title: requiredText(data.title, "Title", 200),
        message: requiredText(data.message, "Message", 5000),
        type: String(data.type || "GENERAL").toUpperCase(),
        batchId: randomUUID(),
        source: actor ? "USER" : "SYSTEM",
        sender,
        receiver,
        audience: "USER",
        audienceLabel: `Single user: ${receiver.name}`
      }
    });
  }

  async getMyNotifications(userId) {
    const rows = await prisma.notification.findMany({
      where: {
        studentId: positiveId(userId, "user ID"),
        hiddenAt: null
      },
      include: {
        student: {
          select: PERSON_SELECT
        }
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" }
      ]
    });

    return rows.map((row) => {
      const { student, ...notification } = row;
      const sender = getSender(row);

      return {
        ...notification,
        sender: {
          id: sender.id,
          name: sender.name,
          role: sender.role
        },
        receiver: getReceiver(row)
      };
    });
  }

  async markAsRead(id, userId) {
    const notificationId = positiveId(id, "notification ID");

    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        studentId: positiveId(userId, "user ID"),
        hiddenAt: null
      },
      data: {
        isRead: true
      }
    });

    if (!result.count) {
      fail("Notification not found in your inbox.", 404);
    }

    return {
      id: notificationId,
      isRead: true
    };
  }

  async markAllRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        studentId: positiveId(userId, "user ID"),
        hiddenAt: null,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return {
      success: true,
      updated: result.count
    };
  }

  async getAllNotifications(actor) {
    await this._requireAdmin(actor);

    const rows = await prisma.notification.findMany({
      include: {
        student: {
          select: PERSON_SELECT
        }
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" }
      ]
    });

    const groups = new Map();

    for (const row of rows) {
      const key = row.batchId || `legacy-${row.id}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          batchId: row.batchId,
          channel: row.type,
          title: row.title,
          message: row.message,
          source: row.source,
          sender: getSender(row),
          audience: row.audience,
          audienceLabel:
            row.audienceLabel ||
            (row.source === "SYSTEM"
              ? "Individual system notification"
              : "Original audience not recorded"),
          sentAt: row.createdAt,
          recipientCount: 0,
          readCount: 0,
          ids: [],
          receivers: []
        });
      }

      const group = groups.get(key);

      group.recipientCount += 1;
      group.readCount += row.isRead ? 1 : 0;
      group.ids.push(row.id);
      group.receivers.push({
        ...getReceiver(row),
        notificationId: row.id,
        isRead: row.isRead,
        hiddenAt: row.hiddenAt
      });
    }

    return [...groups.values()];
  }

  async deleteNotification(id, actor) {
    const result = await prisma.notification.updateMany({
      where: {
        id: positiveId(id, "notification ID"),
        studentId: positiveId(actor?.id, "user ID"),
        hiddenAt: null
      },
      data: {
        hiddenAt: new Date()
      }
    });

    if (!result.count) {
      fail("Notification not found in your inbox.", 404);
    }

    return {
      success: true,
      message: "Notification removed from your inbox."
    };
  }

  async deleteBatch(ids, actor) {
    await this._requireAdmin(actor);

    if (!Array.isArray(ids) || !ids.length) {
      fail("No notification IDs provided.");
    }

    const list = [
      ...new Set(
        ids.map((id) => positiveId(id, "notification ID"))
      )
    ];

    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: list }
      }
    });

    return {
      success: true,
      deleted: result.count
    };
  }
}

module.exports = new NotificationService();