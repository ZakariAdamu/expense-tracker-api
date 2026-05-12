import type { Request, Response } from "express";
import expenseModel from "../models/expenseModel.ts";

// add expense

export const addExpense = async (req: Request, res: Response) => {
  const userId = req.userId; // from auth middleware
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    const { description, amount, category, date } = req.body;
    const expense = new expenseModel({
      userId,
      description,
      amount,
      category,
      date,
    });
    await expense.save();
    res.status(201).json({
      status: "success",
      message: "Expense added successfully",
      expense,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to add expense";
    res.status(400).json({ status: "error", message });
  }
};

// get all expenses
export const getAllExpenses = async (req: Request, res: Response) => {
  const userId = req.userId; // from auth middleware
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    const expenses = await expenseModel.find({ userId }).sort({ date: -1 });
    res.status(200).json({ status: "success", expenses });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch expenses";
    res.status(400).json({ status: "error", message });
  }
};

// update expense
export const updateExpense = async (req: Request, res: Response) => {
  const userId = req.userId; // from auth middleware
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    const { id } = req.params;
    const { description, amount, category, date } = req.body;
    const expense = await expenseModel.findOneAndUpdate(
      { _id: id, userId },
      { description, amount, category, date },
      { new: true },
    );
    res.status(200).json({
      status: "success",
      message: "Expense updated successfully",
      expense,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to update expense";
    res.status(400).json({ status: "error", message });
  }
};

// delete expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // from auth middleware
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    const expense = await expenseModel.findOneAndDelete({ _id: id, userId });
    res.status(200).json({
      status: "success",
      message: "Expense deleted successfully",
      expense,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to delete expense";
    res.status(400).json({ status: "error", message });
  }
};

// export all expenses as csv
export const exportExpensesAsCSV = async (req: Request, res: Response) => {
  try {
    const userId = req.userId; // from auth middleware
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    const expenses = await expenseModel.find({ userId }).sort({ date: -1 });

    const csvData = [
      ["Description", "Amount", "Category", "Date"],
      ...expenses.map((expense) => [
        String(expense.description),
        String(expense.amount),
        String(expense.category),
        new Date(expense.date).toISOString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    res.status(200).send(csvData);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to export expenses";
    res.status(400).json({ status: "error", message });
  }
};
