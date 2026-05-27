import mongoose from "mongoose";
import type { Request, Response } from "express";
import * as z from "zod";
import { sendError, sendSuccess } from "../lib/response.js";
import expenseModel from "../models/expenseModel.ts";

export const expenseSchema = z.object({
  description: z.string().trim().min(1, "description is required"),
  amount: z.coerce.number().finite().nonnegative(),
  category: z.string().trim().min(1, "category is required"),
  date: z.coerce.date().optional(),
});

export const expenseUpdateSchema = expenseSchema.partial();

type ExpenseRange = "daily" | "weekly" | "monthly" | "yearly";

function parsePagination(query: Request["query"]) {
  // If neither page nor limit provided, treat pagination as disabled
  if (query.page === undefined && query.limit === undefined) return null;

  const page = Math.max(Number(query.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function parseDate(value: unknown) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRange(value: unknown): ExpenseRange | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === "daily" ||
    normalized === "weekly" ||
    normalized === "monthly" ||
    normalized === "yearly"
  ) {
    return normalized;
  }

  return null;
}

function getRangeWindow(range: ExpenseRange) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case "daily":
      return { startDate: start, endDate: end };
    case "weekly": {
      const dayOfWeek = start.getDay();
      const daysFromMonday = (dayOfWeek + 6) % 7;
      start.setDate(start.getDate() - daysFromMonday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "monthly": {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case "yearly": {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
  }
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// add expense
export const addExpense = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const validated = expenseSchema.parse(req.body);
    const expense = await expenseModel.create({
      userId: req.userId,
      description: validated.description,
      amount: validated.amount,
      category: validated.category,
      date: validated.date ?? new Date(),
    });

    return sendSuccess(res, 201, "Expense added successfully", { expense });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return sendError(res, 422, "Validation failed", {
        fields: error.flatten().fieldErrors,
      });
    }

    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to add expense",
    );
  }
};

// get all expenses
export const getAllExpenses = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const pagination = parsePagination(req.query);
    const match: Record<string, unknown> = { userId: req.userId };
    const range = parseRange(req.query.range);

    if (req.query.range !== undefined && !range) {
      return sendError(
        res,
        400,
        'range must be one of "daily", "weekly", "monthly", or "yearly"',
      );
    }

    if (typeof req.query.category === "string" && req.query.category.trim()) {
      match.category = req.query.category.trim();
    }

    if (range) {
      const rangeWindow = getRangeWindow(range);
      match.date = {
        ...(rangeWindow
          ? { $gte: rangeWindow.startDate, $lte: rangeWindow.endDate }
          : {}),
      };
    }

    const startDate = parseDate(req.query.startDate);
    const endDate = parseDate(req.query.endDate);
    if (req.query.startDate !== undefined && !startDate) {
      return sendError(res, 400, "Invalid startDate format");
    }
    if (req.query.endDate !== undefined && !endDate) {
      return sendError(res, 400, "Invalid endDate format");
    }
    if (range && (startDate || endDate)) {
      return sendError(
        res,
        400,
        "Cannot provide both range and startDate/endDate",
      );
    }
    if (startDate || endDate) {
      match.date = {
        ...(startDate ? { $gte: startDate } : {}),
        ...(endDate ? { $lte: endDate } : {}),
      };
    }

    if (!pagination) {
      const expenses = await expenseModel
        .find(match)
        .sort({ date: -1, createdAt: -1 });
      return sendSuccess(res, 200, "Expenses retrieved successfully", {
        expenses,
      });
    }

    const { page, limit, skip } = pagination;
    const [total, expenses] = await Promise.all([
      expenseModel.countDocuments(match),
      expenseModel
        .find(match)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return sendSuccess(res, 200, "Expenses retrieved successfully", {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to fetch expenses",
    );
  }
};

// get an expense by id
export const getExpense = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid expense id");
    }

    const expense = await expenseModel.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!expense) {
      return sendError(res, 404, "Expense not found");
    }

    return sendSuccess(res, 200, "Expense retrieved successfully", { expense });
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to fetch expense",
    );
  }
};

// update expense
export const updateExpense = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid expense id");
    }

    const validated = expenseUpdateSchema.parse(req.body);
    const expense = await expenseModel.findOneAndUpdate(
      { _id: id, userId: req.userId },
      {
        ...(validated.description !== undefined
          ? { description: validated.description }
          : {}),
        ...(validated.amount !== undefined ? { amount: validated.amount } : {}),
        ...(validated.category !== undefined
          ? { category: validated.category }
          : {}),
        ...(validated.date !== undefined ? { date: validated.date } : {}),
      },
      { returnDocument: "after", runValidators: true },
    );

    if (!expense) {
      return sendError(res, 404, "Expense not found");
    }

    return sendSuccess(res, 200, "Expense updated successfully", { expense });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return sendError(res, 422, "Validation failed", {
        fields: error.flatten().fieldErrors,
      });
    }

    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to update expense",
    );
  }
};

// delete expense
export const deleteExpense = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid expense id");
    }

    const expense = await expenseModel.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!expense) {
      return sendError(res, 404, "Expense not found");
    }

    return sendSuccess(res, 200, "Expense deleted successfully", { expense });
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to delete expense",
    );
  }
};

// export all expenses as csv
export const exportExpensesAsCSV = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const expenses = await expenseModel.find({ userId: req.userId }).sort({
      date: -1,
    });
    const csvData = [
      ["Description", "Amount", "Category", "Date"],
      ...expenses.map((expense) => [
        expense.description,
        expense.amount,
        expense.category,
        new Date(expense.date).toISOString(),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    return res.status(200).send(csvData);
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to export expenses",
    );
  }
};
