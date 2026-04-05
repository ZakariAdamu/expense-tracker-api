import express from "express";

export const incomeRouter = express.Router();

import {
	addIncome,
	getAllIncomes,
	updateIncome,
	deleteIncome,
	exportIncomesToCSV,
	getTotalIncomeByMonth,
} from "../controllers/incomeController";

incomeRouter.post("/api/income", addIncome);
incomeRouter.get("/api/incomes", getAllIncomes);
incomeRouter.put("/api/incomes/:id", updateIncome);
incomeRouter.delete("/api/incomes/:id", deleteIncome);
incomeRouter.get("/api/incomes/export/csv", exportIncomesToCSV);
incomeRouter.get("/api/incomes/totals", getTotalIncomeByMonth);

export default incomeRouter;
