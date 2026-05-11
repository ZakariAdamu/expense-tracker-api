"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalIncomeByMonth = exports.exportIncomesToCSV = exports.deleteIncome = exports.updateIncome = exports.getAllIncomes = exports.addIncome = void 0;
const incomeModel_1 = __importDefault(require("../models/incomeModel"));
function toDate(value, fallback) {
    if (!value)
        return fallback;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? fallback : date;
}
function toAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : NaN;
}
function missingRequiredIncomeFields(description, amount, category) {
    return !description || amount === undefined || amount === null || !category;
}
function getMonthRange(month, year) {
    const monthNumber = Number(month);
    const yearNumber = Number(year);
    if (!Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12 ||
        !Number.isInteger(yearNumber) ||
        yearNumber < 1900) {
        return null;
    }
    const startDate = new Date(yearNumber, monthNumber - 1, 1);
    const endDate = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);
    return { startDate, endDate };
}
function sortByDateDesc(items) {
    return [...items].sort((a, b) => b.date.getTime() - a.date.getTime());
}
// add income
const addIncome = async (req, res) => {
    const userId = req.userId; // from auth middleware
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
        const income = new incomeModel_1.default({
            userId,
            description,
            amount: parsedAmount,
            category,
            date: toDate(date, new Date()),
        });
        await income.save();
        res.status(201).json({ message: "Income added successfully", income });
    }
    catch (error) {
        res.status(400).json({ status: "error", message: "Server error", error });
    }
};
exports.addIncome = addIncome;
// get all incomes
const getAllIncomes = async (req, res) => {
    const userId = req.userId; // from auth middleware
    try {
        const incomes = await incomeModel_1.default.find({ userId }).sort({ date: -1 });
        res
            .status(200)
            .json({ message: "Incomes retrieved successfully", incomes });
    }
    catch (error) {
        res.status(400).json({ status: "error", message: "Server error", error });
    }
};
exports.getAllIncomes = getAllIncomes;
// update an income
const updateIncome = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId; // from auth middleware
    const { description, amount, category, date } = req.body;
    try {
        const updatedIncome = await incomeModel_1.default.findOneAndUpdate({ _id: id, userId }, {
            description,
            amount: amount === undefined ? undefined : toAmount(amount),
            category,
            date: date === undefined ? undefined : toDate(date, new Date()),
        }, { new: true });
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update income";
        res.status(400).json({ status: "error", message, error });
    }
};
exports.updateIncome = updateIncome;
// delete an income
const deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId; // from auth middleware
        await incomeModel_1.default.findOneAndDelete({ _id: id, userId });
        res
            .status(200)
            .json({ status: "success", message: "Income deleted successfully" });
    }
    catch (error) {
        res
            .status(400)
            .json({ status: "error", message: "Unable to delete income", error });
    }
};
exports.deleteIncome = deleteIncome;
// csv export: download incomes as a CSV file
const exportIncomesToCSV = async (req, res) => {
    const userId = req.userId; // from auth middleware
    try {
        const incomes = await incomeModel_1.default.find({ userId }).sort({ date: -1 });
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
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to export incomes to CSV";
        res.status(400).json({ status: "error", message, error });
    }
};
exports.exportIncomesToCSV = exportIncomesToCSV;
// get total income for a specific month and year
const getTotalIncomeByMonth = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware
        const { month, year } = req.query;
        const range = getMonthRange(month, year);
        if (!range) {
            return res.status(400).json({
                message: "month and year must be valid numbers (month: 1-12)",
            });
        }
        const { startDate, endDate } = range;
        const totalIncome = await incomeModel_1.default.aggregate([
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to get total income";
        res.status(400).json({ status: "error", message, error });
    }
};
exports.getTotalIncomeByMonth = getTotalIncomeByMonth;
