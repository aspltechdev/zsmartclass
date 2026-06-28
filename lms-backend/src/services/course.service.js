// const prisma = require("../config/prisma");
// const slugify = require("slugify");

// class CourseService {

//     async create(data) {

//         const {
//             title,
//             subtitle,
//             description,
//             thumbnail,
//             trailer,
//             language,
//             level,
//             duration,
//             price,
//             discountPrice,
//             requirements,
//             outcomes,
//             audience,
//             categoryId,
//             createdById
//         } = data;

//         const slug = slugify(title, {
//             lower: true,
//             strict: true
//         });

//         const exists = await prisma.course.findUnique({
//             where: {
//                 slug
//             }
//         });

//         if (exists) {
//             throw new Error("Course already exists.");
//         }

//         const course = await prisma.course.create({

//             data: {

//                 title,
//                 slug,
//                 subtitle,
//                 description,
//                 thumbnail,
//                 trailer,
//                 language,
//                 level,
//                 duration: Number(duration),
//                 price: Number(price),
//                 discountPrice: discountPrice
//                     ? Number(discountPrice)
//                     : null,
//                 requirements,
//                 outcomes,
//                 audience,

//                 category: {
//                     connect: {
//                         id: Number(categoryId)
//                     }
//                 },

//                 createdBy: {
//                     connect: {
//                         id: Number(createdById)
//                     }
//                 }

//             },

//             include: {
//                 category: true,
//                 createdBy: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true
//                     }
//                 }
//             }

//         });

//         return course;

//     }

//     async getAll() {

//         return await prisma.course.findMany({

//             include: {
//                 category: true,
//                 createdBy: {
//                     select: {
//                         id: true,
//                         name: true
//                     }
//                 }
//             },

//             orderBy: {
//                 createdAt: "desc"
//             }

//         });

//     }

//     async getById(id) {

//         const course = await prisma.course.findUnique({

//             where: {
//                 id: Number(id)
//             },

//             include: {
//                 category: true,

//                 createdBy: {
//                     select: {
//                         id: true,
//                         name: true
//                     }
//                 },

//                 modules: {
//                     include: {
//                         lessons: true
//                     },
//                     orderBy: {
//                         position: "asc"
//                     }
//                 }

//             }

//         });

//         if (!course) {
//             throw new Error("Course not found.");
//         }

//         return course;

//     }

//     async update(id, data) {

//         const course = await prisma.course.update({

//             where: {
//                 id: Number(id)
//             },

//             data

//         });

//         return course;

//     }

//     async delete(id) {

//         await prisma.course.delete({

//             where: {
//                 id: Number(id)
//             }

//         });

//         return {
//             success: true,
//             message: "Course deleted successfully."
//         };

//     }

// }

// module.exports = new CourseService();


const prisma = require("../config/prisma");
const slugify = require("slugify");

class CourseService {

    async create(data) {

        const {
            title,
            subtitle,
            description,
            thumbnail,
            trailer,
            language,
            level,
            duration,
            price,
            discountPrice,
            requirements,
            outcomes,
            audience,
            categoryId,
            createdById
        } = data;

        if (!title) {
            throw new Error("Course title is required.");
        }

        const category = await prisma.category.findUnique({
            where: {
                id: Number(categoryId)
            }
        });

        if (!category) {
            throw new Error("Category not found.");
        }

        const instructor = await prisma.user.findUnique({
            where: {
                id: Number(createdById)
            }
        });

        if (!instructor) {
            throw new Error("Instructor not found.");
        }

        const slug = slugify(title, {
            lower: true,
            strict: true
        });

        const exists = await prisma.course.findUnique({
            where: {
                slug
            }
        });

        if (exists) {
            throw new Error("Course already exists.");
        }

        const course = await prisma.course.create({

            data: {

                title,
                slug,
                subtitle,
                description,
                thumbnail,
                trailer,
                language,
                level,

                duration: Number(duration),

                price: Number(price),

                discountPrice: discountPrice
                    ? Number(discountPrice)
                    : null,

                requirements,
                outcomes,
                audience,

                category: {
                    connect: {
                        id: Number(categoryId)
                    }
                },

                createdBy: {
                    connect: {
                        id: Number(createdById)
                    }
                }

            },

            include: {

                category: true,

                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }

            }

        });

        return course;

    }

    async getAll() {

        return await prisma.course.findMany({

            include: {

                category: true,

                createdBy: {

                    select: {

                        id: true,
                        name: true,
                        email: true

                    }

                },

                modules: {
                    include: {
                        lessons: true
                    }
                }

            },

            orderBy: {
                createdAt: "desc"
            }

        });

    }

    async getById(id) {

        const course = await prisma.course.findUnique({

            where: {
                id: Number(id)
            },

            include: {

                category: true,

                createdBy: {

                    select: {

                        id: true,
                        name: true,
                        email: true

                    }

                },

                modules: {

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

                }

            }

        });

        if (!course) {
            throw new Error("Course not found.");
        }

        return course;

    }

    async update(id, data) {

        const course = await prisma.course.findUnique({

            where: {
                id: Number(id)
            }

        });

        if (!course) {
            throw new Error("Course not found.");
        }

        if (data.title) {

            data.slug = slugify(data.title, {

                lower: true,
                strict: true

            });

        }

        if (data.duration) {
            data.duration = Number(data.duration);
        }

        if (data.price) {
            data.price = Number(data.price);
        }

        if (data.discountPrice) {
            data.discountPrice = Number(data.discountPrice);
        }

        return await prisma.course.update({

            where: {
                id: Number(id)
            },

            data,

            include: {

                category: true,

                createdBy: {

                    select: {

                        id: true,
                        name: true

                    }

                }

            }

        });

    }

    async delete(id) {

        const course = await prisma.course.findUnique({

            where: {
                id: Number(id)
            }

        });

        if (!course) {
            throw new Error("Course not found.");
        }

        await prisma.course.delete({

            where: {
                id: Number(id)
            }

        });

        return {

            success: true,

            message: "Course deleted successfully."

        };

    }

}

module.exports = new CourseService();
