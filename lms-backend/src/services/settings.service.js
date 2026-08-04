// src/services/settings.service.js
const prisma = require("../config/prisma");

// Defaults double as the schema — every section/key the frontend can ever
// send lives here. get() and update() both merge against this, so a
// settings row saved before a new field existed still comes back complete
// instead of silently missing keys the UI expects.
const DEFAULTS = {
    general: {
        siteName: "ZsmartClass",
        siteEmail: "",
        sitePhone: "",
        address: "",
        timezone: "Asia/Kolkata",
        currency: "INR",
        maintenanceMode: false,
    },
    email: {
        mailHost: "",
        mailPort: "587",
        mailUsername: "",
        mailPassword: "",
        mailFromAddress: "",
        mailFromName: "",
    },
    payment: {
        currency: "INR",
        taxRate: "18",
        enableTax: true,
        enableCoupons: true,
    },
    security: {
        sessionTimeout: "60",
        maxLoginAttempts: "5",
    },
    modules: {
        enableCourses: true,
        enableEnrollments: true,
        enableCertificates: true,
        enableReviews: true,
        enablePayments: true,
        enableNotifications: true,
    },
};

class SettingsService {
    /**
     * Settings live in a single row (id: 1). Created lazily on first read
     * so there's no separate seed step to remember.
     */
    async get() {
        let row = await prisma.settings.findUnique({ where: { id: 1 } });
        if (!row) {
            row = await prisma.settings.create({
                data: { id: 1, data: DEFAULTS },
            });
        }
        return this._merge(DEFAULTS, row.data);
    }

    async update(payload) {
        const current = await this.get();
        const merged = this._merge(current, payload);

        const row = await prisma.settings.upsert({
            where: { id: 1 },
            update: { data: merged },
            create: { id: 1, data: merged },
        });

        return row.data;
    }

    /**
     * Shallow-merges each section so a partial update (e.g. only the
     * "payment" tab) doesn't wipe out unrelated sections, and a saved
     * row from before a field existed still fills in with the default.
     */
    _merge(base, incoming = {}) {
        const out = {};
        for (const section of Object.keys(DEFAULTS)) {
            out[section] = {
                ...DEFAULTS[section],
                ...(base?.[section] || {}),
                ...(incoming?.[section] || {}),
            };
        }
        return out;
    }
}

module.exports = new SettingsService();