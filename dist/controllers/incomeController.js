"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalIncomeByMonth = exports.exportIncomesToCSV = exports.deleteIncome = exports.updateIncome = exports.getAllIncomes = exports.addIncome = void 0;
const incomeModel_1 = __importDefault(require("../models/incomeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const node_crypto_1 = require("node:crypto");
function isMongoConnected() {
    return mongoose_1.default.connection.readyState === 1;
}
const fallbackIncomes = [
    {
        _id: (0, node_crypto_1.randomUUID)(),
        description: "Consulting Payment",
        amount: 4200,
        category: "Consulting",
        date: new Date("2026-04-01T10:00:00.000Z"),
        type: "income",
    },
    {
        _id: (0, node_crypto_1.randomUUID)(),
        description: "Dividend Distribution",
        amount: 860,
        category: "Investments",
        date: new Date("2026-03-25T10:00:00.000Z"),
        type: "income",
    },
];
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
    try {
        const { description, amount, category, date } = req.body;
        if (missingRequiredIncomeFields(description, amount, category)) {
            return res.status(400).json({
                message: "description, amount, and category are required",
            });
        }
        const parsedAmount = toAmount(amount);
        if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
            return res.status(400).json({ message: "amount must be a number >= 0" });
        }
        if (!isMongoConnected()) {
            const income = {
                _id: (0, node_crypto_1.randomUUID)(),
                description: String(description),
                amount: parsedAmount,
                category: String(category),
                date: toDate(date, new Date()),
                type: "income",
            };
            fallbackIncomes.push(income);
            return res.status(201).json(income);
        }
        const income = new incomeModel_1.default({
            description,
            amount: parsedAmount,
            category,
            date: toDate(date, new Date()),
        });
        await income.save();
        res.status(201).json(income);
    }
    catch (error) {
        res.status(400).json({ message: "Server error", error });
    }
};
exports.addIncome = addIncome;
// get all incomes
const getAllIncomes = async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(200).json(sortByDateDesc(fallbackIncomes));
        }
        const incomes = await incomeModel_1.default.find().sort({ date: -1 });
        res.status(200).json(incomes);
    }
    catch (error) {
        res.status(400).json({ message: "Server error", error });
    }
};
exports.getAllIncomes = getAllIncomes;
// update an income
const updateIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, category, date } = req.body;
        if (!isMongoConnected()) {
            const index = fallbackIncomes.findIndex((income) => income._id === id);
            if (index === -1) {
                return res.status(404).json({ message: "Income not found" });
            }
            const current = fallbackIncomes[index];
            const nextAmount = amount === undefined ? current.amount : toAmount(amount);
            if (Number.isNaN(nextAmount) || nextAmount < 0) {
                return res
                    .status(400)
                    .json({ message: "amount must be a number >= 0" });
            }
            const updated = {
                ...current,
                description: description === undefined ? current.description : String(description),
                amount: nextAmount,
                category: category === undefined ? current.category : String(category),
                date: date === undefined ? current.date : toDate(date, current.date),
            };
            fallbackIncomes[index] = updated;
            return res.status(200).json(updated);
        }
        const updatedIncome = await incomeModel_1.default.findByIdAndUpdate(id, {
            description,
            amount: amount === undefined ? undefined : toAmount(amount),
            category,
            date: date === undefined ? undefined : toDate(date, new Date()),
        }, { new: true });
        if (!updatedIncome) {
            return res.status(404).json({ message: "Income not found" });
        }
        res.status(200).json(updatedIncome);
    }
    catch (error) {
        res.status(400).json({ message: "Server error", error });
    }
};
exports.updateIncome = updateIncome;
// delete an income
const deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isMongoConnected()) {
            const index = fallbackIncomes.findIndex((income) => income._id === id);
            if (index === -1) {
                return res.status(404).json({ message: "Income not found" });
            }
            fallbackIncomes.splice(index, 1);
            return res.status(200).json({ message: "Income deleted successfully" });
        }
        await incomeModel_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: "Income deleted successfully" });
    }
    catch (error) {
        res.status(400).json({ message: "Unable to delete income", error });
    }
};
exports.deleteIncome = deleteIncome;
// csv export
const exportIncomesToCSV = async (req, res) => {
    try {
        const incomes = !isMongoConnected()
            ? sortByDateDesc(fallbackIncomes)
            : await incomeModel_1.default.find().sort({ date: -1 });
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
        res.status(400).json({ message: "Server error", error });
    }
};
exports.exportIncomesToCSV = exportIncomesToCSV;
// get total income for a specific month and year
const getTotalIncomeByMonth = async (req, res) => {
    try {
        const { month, year } = req.query;
        const range = getMonthRange(month, year);
        if (!range) {
            return res.status(400).json({
                message: "month and year must be valid numbers (month: 1-12)",
            });
        }
        const { startDate, endDate } = range;
        if (!isMongoConnected()) {
            const totalIncome = fallbackIncomes
                .filter((income) => income.date >= startDate && income.date <= endDate)
                .reduce((sum, income) => sum + income.amount, 0);
            return res.status(200).json({ totalIncome });
        }
        const totalIncome = await incomeModel_1.default.aggregate([
            {
                $match: {
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
        res.status(400).json({ message: "Server error", error });
    }
};
exports.getTotalIncomeByMonth = getTotalIncomeByMonth;
