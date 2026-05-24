import express from "express";

const incomeRouter = express.Router();

import {
  addIncome,
  getAllIncomes,
  updateIncome,
  deleteIncome,
  exportIncomesToCSV,
  getTotalIncomeByMonth,
  getIncome,
} from "../controllers/incomeController.js";
import { protect } from "../middleware/auth.js";

incomeRouter.post("/", protect, addIncome);
incomeRouter.get("/", protect, getAllIncomes);
// the /:id act as a placeholder for the income ID.
incomeRouter.get("/:id", protect, getIncome);
incomeRouter.put("/:id", protect, updateIncome);
incomeRouter.delete("/:id", protect, deleteIncome);
incomeRouter.get("/export/csv", protect, exportIncomesToCSV);
incomeRouter.get("/totals", protect, getTotalIncomeByMonth);

export default incomeRouter;
