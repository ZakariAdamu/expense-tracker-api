import { Router } from "express";
import { portfolioSummary, recentTransactions } from "../lib/finance-data.ts";

export const summaryRouter = Router();

summaryRouter.get("/", (_request, response) => {
  response.json({
    summary: portfolioSummary,
    recentTransactions,
  });
});
