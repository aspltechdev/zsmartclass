// const prisma = require("../config/prisma");

// class LessonService {

//     async create(data) {

//         const {
//             title,
//             description,
//             videoUrl,
//             videoType,
//             attachment,
//             duration,
//             position,
//             isPreview,
//             moduleId
//         } = data;

//         const module = await prisma.courseModule.findUnique({
//             where: {
//                 id: Number(moduleId)
//             }
//         });

//         if (!module) {
//             throw new Error("Module not found.");
//         }

//         const lesson = await prisma.lesson.create({

//             data: {

//                 title,
//                 description,
//                 videoUrl,
//                 videoType,
//                 attachment,

//                 duration: Number(duration),

//                 position: Number(position),

//                 isPreview: Boolean(isPreview),

//                 module: {
//                     connect: {
//                         id: Number(moduleId)
//                     }
//                 }

//             },

//             include: {
//                 module: true
//             }

//         });

//         return lesson;

//     }

//     async getAll() {

//         return await prisma.lesson.findMany({

//             include: {
//                 module: true
//             },

//             orderBy: {
//                 position: "asc"
//             }

//         });

//     }

//     async getById(id) {

//         const lesson = await prisma.lesson.findUnique({

//             where: {
//                 id: Number(id)
//             },

//             include: {
//                 module: true
//             }

//         });

//         if (!lesson) {
//             throw new Error("Lesson not found.");
//         }

//         return lesson;

//     }

//     async getByModule(moduleId) {

//         return await prisma.lesson.findMany({

//             where: {
//                 moduleId: Number(moduleId)
//             },

//             include: {
//                 module: true
//             },

//             orderBy: {
//                 position: "asc"
//             }

//         });

//     }

//     async update(id, data) {

//         return await prisma.lesson.update({

//             where: {
//                 id: Number(id)
//             },

//             data

//         });

//     }

//     async delete(id) {

//         await prisma.lesson.delete({

//             where: {
//                 id: Number(id)
//             }

//         });

//         return {
//             success: true,
//             message: "Lesson deleted successfully."
//         };

//     }

// }

// module.exports = new LessonService();



const prisma = require("../config/prisma");

class LessonService {

    async create(data) {

        const {
            title,
            description,
            videoUrl,
            videoType,
            attachment,
            duration,
            position,
            isPreview,
            moduleId
        } = data;

        if (!title) {
            throw new Error("Lesson title is required.");
        }

        if (!videoType) {
            throw new Error("Video type is required.");
        }

        if (!duration) {
            throw new Error("Lesson duration is required.");
        }

        const module = await prisma.courseModule.findUnique({
            where: {
                id: Number(moduleId)
            },
            include: {
                course: true
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        const lesson = await prisma.lesson.create({

            data: {

                title,
                description,
                videoUrl,
                videoType,
                attachment,

                duration: Number(duration),

                position: Number(position),

                isPreview: Boolean(isPreview),

                module: {
                    connect: {
                        id: Number(moduleId)
                    }
                }

            },

            include: {

                module: {

                    include: {

                        course: true

                    }

                }

            }

        });

        return lesson;

    }

    async getAll() {

        return await prisma.lesson.findMany({

            include: {

                module: {

                    include: {

                        course: true

                    }

                }

            },

            orderBy: [
                {
                    moduleId: "asc"
                },
                {
                    position: "asc"
                }
            ]

        });

    }

    async getById(id) {

        const lesson = await prisma.lesson.findUnique({

            where: {
                id: Number(id)
            },

            include: {

                module: {

                    include: {

                        course: true

                    }

                }

            }

        });

        if (!lesson) {
            throw new Error("Lesson not found.");
        }

        return lesson;

    }

    async getByModule(moduleId) {

        const module = await prisma.courseModule.findUnique({

            where: {
                id: Number(moduleId)
            }

        });

        if (!module) {
            throw new Error("Module not found.");
        }

        return await prisma.lesson.findMany({

            where: {
                moduleId: Number(moduleId)
            },

            include: {

                module: {

                    include: {

                        course: true

                    }

                }

            },

            orderBy: {
                position: "asc"
            }

        });

    }

    async update(id, data) {

        const lesson = await prisma.lesson.findUnique({

            where: {
                id: Number(id)
            }

        });

        if (!lesson) {
            throw new Error("Lesson not found.");
        }

        return await prisma.lesson.update({

            where: {
                id: Number(id)
            },

            data: {

                ...data,

                duration:
                    data.duration !== undefined
                        ? Number(data.duration)
                        : lesson.duration,

                position:
                    data.position !== undefined
                        ? Number(data.position)
                        : lesson.position,

                isPreview:
                    data.isPreview !== undefined
                        ? Boolean(data.isPreview)
                        : lesson.isPreview

            },

            include: {

                module: {

                    include: {

                        course: true

                    }

                }

            }

        });

    }

    async delete(id) {

        const lesson = await prisma.lesson.findUnique({

            where: {
                id: Number(id)
            }

        });

        if (!lesson) {
            throw new Error("Lesson not found.");
        }

        await prisma.lesson.delete({

            where: {
                id: Number(id)
            }

        });

        return {
            success: true,
            message: "Lesson deleted successfully."
        };

    }

}

module.exports = new LessonService();