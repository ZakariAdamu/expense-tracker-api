"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const health_1 = require("./routes/health");
const summary_1 = require("./routes/summary");
const incomeRoute_1 = __importDefault(require("./routes/incomeRoute"));
const expenseRoute_1 = __importDefault(require("./routes/expenseRoute"));
const dashboardRoute_1 = __importDefault(require("./routes/dashboardRoute"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.get("/", (_request, response) => {
        response.json({
            service: "finance-pro-backend",
            message: "Backend is running",
            endpoints: [
                "GET /health",
                "GET /api/summary",
                "GET /api/incomes",
                "POST /api/incomes",
                "PUT /api/incomes/:id",
                "DELETE /api/incomes/:id",
                "GET /api/incomes/export/csv",
                "GET /api/incomes/totals?month=<1-12>&year=<yyyy>",
                "GET /api/expenses",
                "POST /api/expenses",
                "PUT /api/expenses/:id",
                "DELETE /api/expenses/:id",
                "GET /api/expenses/export/csv",
                "GET /api/dashboard",
                "GET /dashboard",
            ],
        });
    });
    // ROUTES
    app.use(health_1.healthRouter);
    app.use(summary_1.summaryRouter);
    app.use(incomeRoute_1.default);
    app.use(expenseRoute_1.default);
    app.use("/api/dashboard", dashboardRoute_1.default);
    app.use("/dashboard", dashboardRoute_1.default);
    app.use((_request, response) => {
        response.status(404).json({
            error: "Not found",
        });
    });
    app.use((error, _request, response, _next) => {
        const message = error instanceof Error ? error.message : "Unexpected server error";
        response.status(500).json({
            error: message,
        });
    });
    return app;
}
