import { Router } from "express";
import type { Request, Response } from "express";
import { portfolioSummary, recentTransactions } from "../lib/finance-data.ts";
import { sendSuccess } from "../lib/response.js";

export const summaryRouter = Router();

summaryRouter.get("/portfolio", (_request: Request, response: Response) => {
	return sendSuccess(response, 200, "Portfolio summary loaded", {
		summary: portfolioSummary,
	});
});

summaryRouter.get(
	"/recent-transactions",
	(_request: Request, response: Response) => {
		return sendSuccess(response, 200, "Recent transactions loaded", {
			recentTransactions,
		});
	},
);
