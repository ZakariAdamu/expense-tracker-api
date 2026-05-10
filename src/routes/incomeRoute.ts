import express from "express";

const incomeRouter = express.Router();

import {
	addIncome,
	getAllIncomes,
	updateIncome,
	deleteIncome,
	exportIncomesToCSV,
	getTotalIncomeByMonth,
} from "../controllers/incomeController";
import { protect } from "../middleware/auth";

incomeRouter.post("/income", protect, addIncome);
incomeRouter.get("/incomes", protect, getAllIncomes);
incomeRouter.put("/incomes/:id", protect, updateIncome);
incomeRouter.delete("/incomes/:id", protect, deleteIncome);
incomeRouter.get("/incomes/export/csv", protect, exportIncomesToCSV);
incomeRouter.get("/incomes/totals", protect, getTotalIncomeByMonth);

export default incomeRouter;
