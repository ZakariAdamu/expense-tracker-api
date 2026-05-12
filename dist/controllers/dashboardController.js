import mongoose from "mongoose";
import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";
export const getDashboardData = async (req, res) => {
    if (!req.userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    try {
        const totalIncome = await incomeModel.aggregate([
            {
                $match: {
                    userId,
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
        const totalExpense = await expenseModel.aggregate([
            {
                $match: {
                    userId,
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
        const monthlyIncome = await incomeModel.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        const monthlyExpense = await expenseModel.aggregate([
            { $match: { userId } },
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
            incomeModel.find({ userId }).sort({ date: -1 }).limit(5),
            expenseModel.find({ userId }).sort({ date: -1 }).limit(5),
        ]).then(([incomes, expenses]) => {
            const transactions = [
                ...incomes.map((income) => ({
                    ...income.toObject(),
                    type: "income",
                })),
                ...expenses.map((expense) => ({
                    ...expense.toObject(),
                    type: "expense",
                })),
            ];
            return transactions
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 5);
        });
        const spendingByCategory = await expenseModel.aggregate([
            { $match: { userId } },
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
        const message = error instanceof Error ? error.message : "Unable to load dashboard";
        res.status(400).json({ message, error: message });
    }
};
