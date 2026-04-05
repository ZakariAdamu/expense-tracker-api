import { Router } from "express";
import { portfolioSummary, recentTransactions } from "../lib/finance-data";

export const summaryRouter = Router();

summaryRouter.get("/api/summary", (_request, response) => {
	response.json({
		summary: portfolioSummary,
		recentTransactions,
	});
});
