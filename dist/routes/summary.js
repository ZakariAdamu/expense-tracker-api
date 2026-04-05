"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryRouter = void 0;
const express_1 = require("express");
const finance_data_1 = require("../lib/finance-data");
exports.summaryRouter = (0, express_1.Router)();
exports.summaryRouter.get("/api/summary", (_request, response) => {
    response.json({
        summary: finance_data_1.portfolioSummary,
        recentTransactions: finance_data_1.recentTransactions,
    });
});
