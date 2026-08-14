const prisma = require("../config/prisma");
const slugify = require("slugify");

class CategoryService {
  /**
   * Turn arbitrary text into a safe, URL-friendly slug.
   * Honors an explicit slug if the caller provided one; otherwise derives it
   * from the name. Always sanitized the same way so create/update agree.
   */
  _makeSlug(source) {
    return slugify(String(source || ""), { lower: true, strict: true });
  }

  _validateName(name) {
    if (!name || !String(name).trim()) {
      const error = new Error("Category name is required");
      error.statusCode = 400;
      throw error;
    }
  }

  async create(data = {}) {
    const { name, slug, description, image } = data;

    this._validateName(name);

    const cleanName = name.trim();
    // Honor a user-supplied slug (sanitized) or derive one from the name.
    const cleanSlug = this._makeSlug(slug || cleanName);

    if (!cleanSlug) {
      const error = new Error("Could not generate a valid slug from the name");
      error.statusCode = 400;
      throw error;
    }

    // Friendly duplicate checks (the DB @unique constraints are the real guard,
    // but these give clear messages instead of a raw Prisma P2002).
    const clash = await prisma.category.findFirst({
      where: { OR: [{ name: cleanName }, { slug: cleanSlug }] },
      select: { name: true, slug: true },
    });

    if (clash) {
      const error = new Error(
        clash.name === cleanName
          ? "A category with this name already exists"
          : "A category with this slug already exists"
      );
      error.statusCode = 409;
      throw error;
    }

    const category = await prisma.category.create({
      data: {
        name: cleanName,
        slug: cleanSlug,
        description: description ?? null,
        image: image ?? null,
      },
    });

    return { success: true, data: category };
  }

  async getAll() {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { courses: true } },
      },
    });

    return { success: true, data: categories };
  }

  async getById(id) {
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { courses: true } },
      },
    });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    return { success: true, data: category };
  }

  async update(id, data = {}) {
    const categoryId = Number(id);

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    const { name, slug, description, image } = data;

    // Build the update payload from a whitelist so stray body fields (id,
    // createdAt, etc.) can't reach Prisma and trigger validation errors.
    const payload = {};

    if (name !== undefined) {
      this._validateName(name);
      payload.name = name.trim();
    }

    // Resolve the slug: explicit slug wins, else regenerate from a new name,
    // else leave the existing slug untouched.
    let nextSlug;
    if (slug !== undefined && String(slug).trim() !== "") {
      nextSlug = this._makeSlug(slug);
    } else if (payload.name && payload.name !== existing.name) {
      nextSlug = this._makeSlug(payload.name);
    }
    if (nextSlug) payload.slug = nextSlug;

    if (description !== undefined) payload.description = description;
    if (image !== undefined) payload.image = image;

    // Uniqueness checks that exclude the record being edited.
    const orConditions = [];
    if (payload.name && payload.name !== existing.name) {
      orConditions.push({ name: payload.name });
    }
    if (payload.slug && payload.slug !== existing.slug) {
      orConditions.push({ slug: payload.slug });
    }

    if (orConditions.length) {
      const clash = await prisma.category.findFirst({
        where: { AND: [{ id: { not: categoryId } }, { OR: orConditions }] },
        select: { name: true, slug: true },
      });

      if (clash) {
        const error = new Error(
          clash.name === payload.name
            ? "A category with this name already exists"
            : "A category with this slug already exists"
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: payload,
    });

    return { success: true, data: category };
  }

  async delete(id) {
    const categoryId = Number(id);

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { courses: true } } },
    });

    if (!existing) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    // Course.categoryId is required with no cascade, so deleting a category
    // that still has courses would fail with a raw FK error. Return a clear
    // message and status instead.
    if (existing._count.courses > 0) {
      const error = new Error(
        `Cannot delete this category because ${existing._count.courses} ` +
          `course(s) are assigned to it. Reassign or remove those courses first.`
      );
      error.statusCode = 409;
      throw error;
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return { success: true, message: "Category deleted successfully." };
  }
}

module.exports = new CategoryService();