import express from "express";

export const expenseRouter = express.Router();

import {
	addExpense,
	getAllExpenses,
	updateExpense,
	deleteExpense,
	exportExpensesAsCSV,
} from "../controllers/expenseController";

expenseRouter.post("/api/expense", addExpense);
expenseRouter.get("/api/expenses", getAllExpenses);
expenseRouter.put("/api/expenses/:id", updateExpense);
expenseRouter.delete("/api/expenses/:id", deleteExpense);
expenseRouter.get("/api/expenses/export/csv", exportExpensesAsCSV);

export default expenseRouter;
