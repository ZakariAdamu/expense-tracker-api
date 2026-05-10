import express from "express";

import {
	addExpense,
	getAllExpenses,
	updateExpense,
	deleteExpense,
	exportExpensesAsCSV,
} from "../controllers/expenseController";
import { protect } from "../middleware/auth";

const expenseRouter = express.Router();

expenseRouter.post("/expense", protect, addExpense);
expenseRouter.get("/expeses", protect, getAllExpenses);
expenseRouter.put("/expeses/:id", protect, updateExpense);
expenseRouter.delete("/expeses/:id", protect, deleteExpense);
expenseRouter.get("/expeses/export/csv", protect, exportExpensesAsCSV);

export default expenseRouter;
