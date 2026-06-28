const prisma = require("../config/prisma");

class ModuleService {

    async create(data) {

        const {
            title,
            description,
            position,
            courseId
        } = data;

        const course = await prisma.course.findUnique({
            where: {
                id: Number(courseId)
            }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        const module = await prisma.courseModule.create({

            data: {

                title,
                description,
                position: Number(position),

                course: {
                    connect: {
                        id: Number(courseId)
                    }
                }

            },

            include: {
                course: true
            }

        });

        return module;

    }

    async getAll() {

        return await prisma.courseModule.findMany({

            include: {
                course: true,
                lessons: true
            },

            orderBy: {
                position: "asc"
            }

        });

    }

    async getById(id) {

        const module = await prisma.courseModule.findUnique({

            where: {
                id: Number(id)
            },

            include: {
                course: true,
                lessons: {
                    orderBy: {
                        position: "asc"
                    }
                }
            }

        });

        if (!module) {
            throw new Error("Module not found.");
        }

        return module;

    }

    async getByCourse(courseId) {

        return await prisma.courseModule.findMany({

            where: {
                courseId: Number(courseId)
            },

            include: {
                lessons: {
                    orderBy: {
                        position: "asc"
                    }
                }
            },

            orderBy: {
                position: "asc"
            }

        });

    }

    async update(id, data) {

        return await prisma.courseModule.update({

            where: {
                id: Number(id)
            },

            data

        });

    }

    async delete(id) {

        await prisma.courseModule.delete({

            where: {
                id: Number(id)
            }

        });

        return {
            success: true,
            message: "Module deleted successfully."
        };

    }

}

module.exports = new ModuleService();