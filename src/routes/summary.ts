import { Router } from "express";
import type { Request, Response } from "express";
import { portfolioSummary, recentTransactions } from "../lib/finance-data.ts";

export const summaryRouter = Router();

summaryRouter.get("/", (_request: Request, response: Response) => {
  response.json({
    summary: portfolioSummary,
    recentTransactions,
  });
});
