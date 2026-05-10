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

incomeRouter.post("/", protect, addIncome);
incomeRouter.get("/", protect, getAllIncomes);
incomeRouter.put("/:id", protect, updateIncome);
incomeRouter.delete("/:id", protect, deleteIncome);
incomeRouter.get("/export/csv", protect, exportIncomesToCSV);
incomeRouter.get("/totals", protect, getTotalIncomeByMonth);

export default incomeRouter;
