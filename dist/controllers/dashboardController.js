"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const incomeModel_1 = __importDefault(require("../models/incomeModel"));
const expenseModel_1 = __importDefault(require("../models/expenseModel"));
const getDashboardData = async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    try {
        const totalIncome = await incomeModel_1.default.aggregate([
            {
                $match: {
                    date: { $gte: startOfMonth, $lte: now },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);
        const totalExpense = await expenseModel_1.default.aggregate([
            {
                $match: {
                    date: { $gte: startOfMonth, $lte: now },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);
        const monthlyIncome = await incomeModel_1.default.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        const monthlyExpense = await expenseModel_1.default.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        const savings = (monthlyIncome[0]?.total || 0) - (monthlyExpense[0]?.total || 0);
        const savingsRate = monthlyIncome[0]?.total
            ? (savings / monthlyIncome[0].total) * 100
            : 0;
        const recentTransactions = await Promise.all([
            incomeModel_1.default.find().sort({ date: -1 }).limit(5),
            expenseModel_1.default.find().sort({ date: -1 }).limit(5),
        ]).then(([incomes, expenses]) => {
            const transactions = [
                ...incomes.map((income) => ({ ...income.toObject(), type: "income" })),
                ...expenses.map((expense) => ({
                    ...expense.toObject(),
                    type: "expense",
                })),
            ];
            return transactions
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 5);
        });
        const spendingByCategory = await expenseModel_1.default.aggregate([
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { total: -1 } },
        ]);
        // for chart visualization
        const expenseDistribution = spendingByCategory.map((item) => ({
            category: item._id,
            total: item.total,
            percentage: totalExpense[0]?.total
                ? (item.total / totalExpense[0].total) * 100
                : 0,
        }));
        res.status(200).json({
            totalIncome: totalIncome[0]?.total || 0,
            totalExpense: totalExpense[0]?.total || 0,
            savings,
            savingsRate,
            recentTransactions,
            monthlyIncome,
            monthlyExpense,
            spendingByCategory,
            expenseDistribution,
        });
    }
    catch (error) {
        res.status(400).json({ message: "Server error", error });
    }
};
exports.getDashboardData = getDashboardData;
