const prisma = require("../config/prisma");
const slugify = require("slugify");

class CategoryService {

    async create(data) {

        const { name, description, image } = data;

        const exists = await prisma.category.findUnique({
            where: {
                name
            }
        });

        if (exists) {
            throw new Error("Category already exists.");
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug: slugify(name, {
                    lower: true,
                    strict: true
                }),
                description,
                image
            }
        });

        return category;
    }

    async getAll() {

        return await prisma.category.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

    }

    async getById(id) {

        return await prisma.category.findUnique({
            where: {
                id: Number(id)
            }
        });

    }

    async update(id, data) {

        return await prisma.category.update({
            where: {
                id: Number(id)
            },
            data
        });

    }

    async delete(id) {

        await prisma.category.delete({
            where: {
                id: Number(id)
            }
        });

        return {
            success: true,
            message: "Category deleted successfully."
        };

    }

}

module.exports = new CategoryService();