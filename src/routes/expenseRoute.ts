import express from "express";

import {
  addExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
  exportExpensesAsCSV,
  getExpense,
} from "../controllers/expenseController.ts";
import { protect } from "../middleware/auth.ts";

const expenseRouter = express.Router();

expenseRouter.post("/", protect, addExpense);
expenseRouter.get("/", protect, getAllExpenses);
expenseRouter.get("/:id", protect, getExpense);
expenseRouter.put("/:id", protect, updateExpense);
expenseRouter.delete("/:id", protect, deleteExpense);
expenseRouter.get("/export/csv", protect, exportExpensesAsCSV);

export default expenseRouter;
