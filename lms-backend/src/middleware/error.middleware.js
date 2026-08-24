// src/middleware/error.middleware.js
//
// Centralised error handling. Two exports:
//   notFound      -> 404 for unmatched routes
//   errorHandler  -> the final Express error handler
//
// WIRING (add these AFTER all your app.use("/api/...") route lines in app.js):
//
//   const { notFound, errorHandler } = require("./middleware/error.middleware");
//   app.use(notFound);
//   app.use(errorHandler);
//
// Order matters — Express only treats a 4-argument function as an error
// handler, and it must be registered last.

const isProd = process.env.NODE_ENV === "production";

/**
 * Turn a Prisma error into a friendly message + status code.
 * Without this, clients see raw text like:
 *   "Invalid `prisma.user.create()` invocation ... Unique constraint failed"
 */
function translatePrisma(err) {
    const code = err?.code;

    // P2002 — unique constraint violation
    if (code === "P2002") {
        const fields = err.meta?.target;
        const field = Array.isArray(fields) ? fields.join(", ") : fields || "value";
        return {
            statusCode: 409,
            message: `That ${field} is already in use.`,
        };
    }

    // P2025 — record not found (update/delete on a missing row)
    if (code === "P2025") {
        return { statusCode: 404, message: "The requested record was not found." };
    }

    // P2003 — foreign key constraint (e.g. deleting a row others depend on)
    if (code === "P2003") {
        return {
            statusCode: 409,
            message:
                "This record is still linked to other data and can't be removed. " +
                "Remove or reassign the related items first.",
        };
    }

    // P2000 — value too long for the column
    if (code === "P2000") {
        return { statusCode: 400, message: "One of the values provided is too long." };
    }

    // Validation errors (unknown field, wrong type, bad enum value…)
    if (err?.name === "PrismaClientValidationError") {
        return {
            statusCode: 400,
            message: "Invalid data sent to the database. Please check the fields and try again.",
        };
    }

    // Can't reach the database
    if (err?.name === "PrismaClientInitializationError") {
        return { statusCode: 503, message: "Database is unavailable. Please try again shortly." };
    }

    return null;
}

/**
 * 404 for any route that didn't match.
 */
function notFound(req, res, next) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

/**
 * Final error handler. Express identifies this by its 4 arguments,
 * so `next` must stay in the signature even though it's unused.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // If a response already started streaming, hand back to Express.
    if (res.headersSent) return next(err);

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Something went wrong.";

    // ---- Known error shapes -------------------------------------------
    const prisma = translatePrisma(err);
    if (prisma) {
        statusCode = prisma.statusCode;
        message = prisma.message;
    }

    // JWT
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid authentication token.";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Your session has expired. Please sign in again.";
    }

    // Multer uploads
    if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 413;
        message = "That file is too large.";
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        statusCode = 400;
        message = "Unexpected file field in the upload.";
    }

    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        statusCode = 400;
        message = "Invalid JSON in the request body.";
    }

    // ---- Never leak internals in production ---------------------------
    if (statusCode >= 500) {
        console.error("‼️  Unhandled error:", {
            method: req.method,
            url: req.originalUrl,
            message: err.message,
            stack: err.stack,
        });

        if (isProd) message = "Something went wrong on our end. Please try again.";
    }

    const payload = { success: false, message };

    // Stack traces only outside production, to aid debugging.
    if (!isProd && err.stack) payload.stack = err.stack;

    res.status(statusCode).json(payload);
}

/**
 * Wrapper so async controllers don't each need try/catch.
 *
 *   const { asyncHandler } = require("../middleware/error.middleware");
 *   exports.getAll = asyncHandler(async (req, res) => {
 *       const data = await service.getAll();
 *       res.json({ success: true, data });
 *   });
 *
 * Any thrown/rejected error is forwarded to errorHandler automatically.
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { notFound, errorHandler, asyncHandler };
module.exports.default = errorHandler;