// src/utils/response.js
//
// Small helpers so every endpoint returns the SAME shape.
// They match the format your frontend already reads:
//     { success: true,  data, message?, pagination? }
//     { success: false, message }
//
// Usage:
//     const { ok, created, fail, paginated } = require("../utils/response");
//     return ok(res, user);
//     return created(res, course, "Course created successfully.");
//     return fail(res, "Course not found.", 404);

/**
 * 200 — success with a payload.
 */
function ok(res, data = null, message) {
    const body = { success: true };
    if (message) body.message = message;
    if (data !== null && data !== undefined) body.data = data;
    return res.status(200).json(body);
}

/**
 * 201 — resource created.
 */
function created(res, data = null, message = "Created successfully.") {
    const body = { success: true, message };
    if (data !== null && data !== undefined) body.data = data;
    return res.status(201).json(body);
}

/**
 * 200 — success with no payload (deletes, toggles…).
 */
function done(res, message = "Done.") {
    return res.status(200).json({ success: true, message });
}

/**
 * Error response. Prefer `throw createError(...)` inside services so the
 * central error handler formats it; use this for direct controller returns.
 */
function fail(res, message = "Something went wrong.", statusCode = 400) {
    return res.status(statusCode).json({ success: false, message });
}

/**
 * 200 — a page of results plus pagination metadata.
 */
function paginated(res, data = [], { page = 1, limit = 10, total = 0 } = {}) {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            page: p,
            limit: l,
            total,
            totalPages: l > 0 ? Math.ceil(total / l) : 0,
            hasNextPage: p * l < total,
            hasPrevPage: p > 1,
        },
    });
}

/**
 * Build an Error carrying a status code, for services to throw.
 *
 *     throw createError("Course not found.", 404);
 *
 * The central error handler reads `statusCode` and responds accordingly,
 * which is why services in this codebase set `error.statusCode`.
 */
function createError(message, statusCode = 400) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

module.exports = { ok, created, done, fail, paginated, createError };