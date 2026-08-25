// src/middleware/optionalAuth.middleware.js
//
// Soft authentication. Unlike authMiddleware (which 401s when a token is
// missing or invalid), this NEVER blocks the request — it simply populates
// req.user when a valid Bearer token is present, and leaves it undefined
// otherwise.
//
// Use it on routes that must stay reachable anonymously but need to behave
// differently for privileged callers — e.g. GET /modules/:id, which is public
// for course browsing yet must only expose lesson videoUrls to MENTOR/ADMIN.

const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(); // anonymous — carry on with no req.user
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (user) {
            req.user = user;
        }
    } catch (err) {
        // A bad/expired token on an optional route is treated as anonymous,
        // not an error — the route still works, just without req.user.
    }

    return next();
};

module.exports = optionalAuthMiddleware;
