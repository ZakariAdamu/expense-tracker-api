"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet")); // ← Add this
const compression_1 = __importDefault(require("compression")); // ← Add this (optional but recommended)
// Import your routes
const health_1 = require("./routes/health");
const summary_1 = require("./routes/summary");
const incomeRoute_1 = __importDefault(require("./routes/incomeRoute"));
const expenseRoute_1 = __importDefault(require("./routes/expenseRoute"));
const dashboardRoute_1 = __importDefault(require("./routes/dashboardRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
function createApp() {
    const app = (0, express_1.default)();
    // ====================== MIDDLEWARE ======================
    // 1. Security headers (Very Important)
    app.use((0, helmet_1.default)());
    // 2. CORS (Configure allowed origins based on environment)
    // Determine which origin to allow
    const getAllowedOrigins = () => {
        const devUrl = process.env.FRONTEND_DEV_URL;
        const prodUrl = process.env.FRONTEND_PROD_URL;
        if (process.env.NODE_ENV === "production") {
            return prodUrl ? [prodUrl] : [];
        }
        // In development, allow both localhost frontend + production (for testing)
        return [devUrl, prodUrl].filter(Boolean);
    };
    app.use((0, cors_1.default)({
        origin: getAllowedOrigins(),
        credentials: true, // ← Important for cookies (JWT)
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    // 3. Compression (speeds up responses)
    app.use((0, compression_1.default)());
    // 4. Body parsing
    app.use(express_1.default.json({ limit: "10mb" })); // Prevent huge payloads
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    // 5. Cookie parser
    app.use((0, cookie_parser_1.default)());
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // limit each IP
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use("/api/users/login", limiter);
    app.use("/api/users/register", limiter);
    // ====================== BASIC ROUTE ======================
    app.get("/", (_req, res) => {
        res.json({
            service: "finance-pro-backend",
            status: "running",
            version: process.env.npm_package_version || "1.0.0",
            message: "Backend is healthy",
        });
    });
    // ====================== ROUTES ======================
    app.use("/api/health", health_1.healthRouter); // Better to mount with prefix
    app.use("/api/users", userRoute_1.default);
    app.use("/api/summary", summary_1.summaryRouter);
    app.use("/api/incomes", incomeRoute_1.default);
    app.use("/api/expenses", expenseRoute_1.default);
    app.use("/api/dashboard", dashboardRoute_1.default);
    // Optional: Keep /dashboard if you serve some HTML/views
    app.use("/dashboard", dashboardRoute_1.default);
    // ====================== 404 HANDLER ======================
    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found" });
    });
    // ====================== GLOBAL ERROR HANDLER ======================
    app.use((error, _req, res, _next) => {
        console.error("Unhandled Error:", error); // Log for debugging
        const message = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            error: message,
            // Only show stack in development
            ...(process.env.NODE_ENV === "development" && {
                stack: error instanceof Error ? error.stack : undefined,
            }),
        });
    });
    return app;
}
