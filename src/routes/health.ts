import { Router, type Request, type Response } from "express";
import { getMongoStatus } from "../db/mongo";

export const healthRouter = Router();

healthRouter.get("/health", (_request: Request, response: Response) => {
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
