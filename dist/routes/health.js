import { Router } from "express";
import { getMongoStatus } from "../db/mongo.js";
export const healthRouter = Router();
healthRouter.get("/", (_request, response) => {
    const mongo = getMongoStatus();
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
