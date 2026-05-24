import mongoose from "mongoose";
import type { Request, Response } from "express";
import * as z from "zod";
import { sendError, sendSuccess } from "../lib/response.js";
import incomeModel from "../models/incomeModel.ts";

export const incomeSchema = z.object({
  description: z.string().trim().min(1, "description is required"),
  amount: z.coerce.number().finite().nonnegative(),
  category: z.string().trim().min(1, "category is required"),
  date: z.coerce.date().optional(),
});

export const incomeUpdateSchema = incomeSchema.partial();

type IncomeRange = "daily" | "weekly" | "monthly" | "yearly";

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

function parseRange(value: unknown): IncomeRange | null {
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

function getRangeWindow(range: IncomeRange) {
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

  return {
    startDate: new Date(yearNumber, monthNumber - 1, 1),
    endDate: new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999),
  };
}

function getUserObjectId(userId: string) {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
}

// add income
export const addIncome = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const validated = incomeSchema.parse(req.body);
    const income = await incomeModel.create({
      userId: req.userId,
      description: validated.description,
      amount: validated.amount,
      category: validated.category,
      date: validated.date ?? new Date(),
    });

    return sendSuccess(res, 201, "Income added successfully", { income });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return sendError(res, 422, "Validation failed", {
        fields: error.flatten().fieldErrors,
      });
    }

    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to add income",
    );
  }
};

// get all incomes
export const getAllIncomes = async (req: Request, res: Response) => {
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

    if (startDate || endDate) {
      match.date = {
        ...(match.date && typeof match.date === "object" ? match.date : {}),
        ...(startDate ? { $gte: startDate } : {}),
        ...(endDate ? { $lte: endDate } : {}),
      };
    }

    if (!pagination) {
      const incomes = await incomeModel
        .find(match)
        .sort({ date: -1, createdAt: -1 });
      return sendSuccess(res, 200, "Incomes retrieved successfully", {
        incomes,
      });
    }

    const { page, limit, skip } = pagination;
    const [total, incomes] = await Promise.all([
      incomeModel.countDocuments(match),
      incomeModel
        .find(match)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return sendSuccess(res, 200, "Incomes retrieved successfully", {
      incomes,
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
      error instanceof Error ? error.message : "Unable to fetch incomes",
    );
  }
};

// get an income by id
export const getIncome = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid income id");
    }

    const income = await incomeModel.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!income) {
      return sendError(res, 404, "Income not found");
    }

    return sendSuccess(res, 200, "Income retrieved successfully", { income });
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to fetch income",
    );
  }
};

// update an income
export const updateIncome = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid income id");
    }

    const validated = incomeUpdateSchema.parse(req.body);
    const updatedIncome = await incomeModel.findOneAndUpdate(
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

    if (!updatedIncome) {
      return sendError(res, 404, "Income not found");
    }

    return sendSuccess(res, 200, "Income updated successfully", {
      income: updatedIncome,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return sendError(res, 422, "Validation failed", {
        fields: error.flatten().fieldErrors,
      });
    }

    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to update income",
    );
  }
};

// delete an income
export const deleteIncome = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid income id");
    }

    const deletedIncome = await incomeModel.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deletedIncome) {
      return sendError(res, 404, "Income not found");
    }

    return sendSuccess(res, 200, "Income deleted successfully", {
      income: deletedIncome,
    });
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to delete income",
    );
  }
};

// csv export: download incomes as a CSV file
export const exportIncomesToCSV = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const incomes = await incomeModel.find({ userId: req.userId }).sort({
      date: -1,
    });
    const csvData = [
      ["Description", "Amount", "Category", "Date"],
      ...incomes.map((income) => [
        income.description,
        income.amount,
        income.category,
        new Date(income.date).toISOString(),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=incomes.csv");
    return res.status(200).send(csvData);
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error
        ? error.message
        : "Unable to export incomes to CSV",
    );
  }
};

// get total income for a specific month and year
export const getTotalIncomeByMonth = async (req: Request, res: Response) => {
  if (!req.userId) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const range = getMonthRange(req.query.month, req.query.year);
    if (!range) {
      return sendError(res, 400, "month and year must be valid numbers");
    }

    const userObjectId = getUserObjectId(req.userId);
    if (!userObjectId) {
      return sendError(res, 400, "Invalid user id");
    }

    const totalIncome = await incomeModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: range.startDate, $lte: range.endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return sendSuccess(res, 200, "Monthly total retrieved successfully", {
      totalIncome: totalIncome[0]?.total ?? 0,
    });
  } catch (error: unknown) {
    return sendError(
      res,
      400,
      error instanceof Error ? error.message : "Unable to get total income",
    );
  }
};
