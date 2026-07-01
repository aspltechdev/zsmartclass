const prisma = require("../config/prisma");

class NotificationService {

    async create(data) {

        const {

            studentId,

            title,

            message,

            type

        } = data;

        return await prisma.notification.create({

            data: {

                studentId: Number(studentId),

                title,

                message,

                type

            }

        });

    }

    async getMyNotifications(studentId) {

        return await prisma.notification.findMany({

            where: {

                studentId: Number(studentId)

            },

            orderBy: {

                createdAt: "desc"

            }

        });

    }

    async markAsRead(id) {

        return await prisma.notification.update({

            where: {

                id: Number(id)

            },

            data: {

                isRead: true

            }

        });

    }

    async markAllRead(studentId) {

        await prisma.notification.updateMany({

            where: {

                studentId: Number(studentId),

                isRead: false

            },

            data: {

                isRead: true

            }

        });

        return {

            success: true,

            message: "All notifications marked as read."

        };

    }

    async delete(id) {

        await prisma.notification.delete({

            where: {

                id: Number(id)

            }

        });

        return {

            success: true,

            message: "Notification deleted."

        };

    }

}

module.exports = new NotificationService();