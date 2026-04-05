"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const mongo_1 = require("../db/mongo");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/health", (_request, response) => {
    const mongo = (0, mongo_1.getMongoStatus)();
    response.json({
        status: "ok",
        service: "finance-pro-backend",
        timestamp: new Date().toISOString(),
        database: {
            provider: "mongodb",
            ...mongo,
        },
    });
});
