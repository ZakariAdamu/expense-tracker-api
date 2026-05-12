import type { Request, Response } from "express";
import incomeModel from "../models/incomeModel.ts";

function toDate(value: unknown, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function toAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

function missingRequiredIncomeFields(
  description: unknown,
  amount: unknown,
  category: unknown,
) {
  return !description || amount === undefined || amount === null || !category;
}

function getMonthRange(month: unknown, year: unknown) {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    !Number.isInteger(yearNumber) ||
    yearNumber < 1900
  ) {
    return null;
  }

  const startDate = new Date(yearNumber, monthNumber - 1, 1);
  const endDate = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);

  return { startDate, endDate };
}

// add income

export const addIncome = async (req: Request, res: Response) => {
  const userId = req.userId; // from auth middleware
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  const { description, amount, category, date } = req.body;
  try {
    if (missingRequiredIncomeFields(description, amount, category)) {
      return res.status(400).json({
        message: "description, amount, and category are required",
      });
    }

    const parsedAmount = toAmount(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: "amount must be a number >= 0" });
    }

    const income = new incomeModel({
      userId,
      description,
      amount: parsedAmount,
      category,
      date: toDate(date, new Date()),
    });
    await income.save();
    res.status(201).json({ message: "Income added successfully", income });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to add income";
    res.status(400).json({ status: "error", message });
  }
};

// get all incomes

export const getAllIncomes = async (req: Request, res: Response) => {
  const userId = req.userId; // from auth middleware
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    const incomes = await incomeModel.find({ userId }).sort({ date: -1 });
    res
      .status(200)
      .json({ message: "Incomes retrieved successfully", incomes });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch incomes";
    res.status(400).json({ status: "error", message });
  }
};

// update an income

export const updateIncome = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId; // from auth middleware
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  const { description, amount, category, date } = req.body;
  try {
    const updatedIncome = await incomeModel.findOneAndUpdate(
      { _id: id, userId },
      {
        description,
        amount: amount === undefined ? undefined : toAmount(amount),
        category,
        date: date === undefined ? undefined : toDate(date, new Date()),
      },
      { new: true },
    );

    if (!updatedIncome) {
      return res
        .status(404)
        .json({ status: "error", message: "Income not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Income updated successfully",
      income: updatedIncome,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to update income";
    res.status(400).json({ status: "error", message });
  }
};

// delete an income

export const deleteIncome = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // from auth middleware
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    await incomeModel.findOneAndDelete({ _id: id, userId });
    res
      .status(200)
      .json({ status: "success", message: "Income deleted successfully" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to delete income";
    res.status(400).json({ status: "error", message });
  }
};

// csv export: download incomes as a CSV file

export const exportIncomesToCSV = async (req: Request, res: Response) => {
  const userId = req.userId; // from auth middleware
  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    const incomes = await incomeModel.find({ userId }).sort({ date: -1 });

    const csvData = [
      ["Description", "Amount", "Category", "Date"],
      ...incomes.map((income) => [
        String(income.description),
        String(income.amount),
        String(income.category),
        new Date(income.date).toISOString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=incomes.csv");
    res.status(200).send(csvData);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to export incomes to CSV";
    res.status(400).json({ status: "error", message });
  }
};

// get total income for a specific month and year

export const getTotalIncomeByMonth = async (req: Request, res: Response) => {
  try {
    const userId = req.userId; // from auth middleware
    if (!userId) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    const { month, year } = req.query;
    const range = getMonthRange(month, year);

    if (!range) {
      return res.status(400).json({
        message: "month and year must be valid numbers (month: 1-12)",
      });
    }

    const { startDate, endDate } = range;

    const totalIncome = await incomeModel.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    res.status(200).json({ totalIncome: totalIncome[0]?.total || 0 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to get total income";
    res.status(400).json({ status: "error", message });
  }
};
