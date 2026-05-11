"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExpensesAsCSV = exports.deleteExpense = exports.updateExpense = exports.getAllExpenses = exports.addExpense = void 0;
const expenseModel_1 = __importDefault(require("../models/expenseModel"));
// add expense
const addExpense = async (req, res) => {
    const userId = req.userId; // from auth middleware
    try {
        const { description, amount, category, date } = req.body;
        const expense = new expenseModel_1.default({
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
    }
    catch (error) {
        res
            .status(400)
            .json({ status: "error", message: error.message });
    }
};
exports.addExpense = addExpense;
// get all expenses
const getAllExpenses = async (req, res) => {
    const userId = req.userId; // from auth middleware
    try {
        const expenses = await expenseModel_1.default.find({ userId }).sort({ date: -1 });
        res.status(200).json({ status: "success", expenses });
    }
    catch (error) {
        res
            .status(400)
            .json({ status: "error", message: error.message });
    }
};
exports.getAllExpenses = getAllExpenses;
// update expense
const updateExpense = async (req, res) => {
    const userId = req.userId; // from auth middleware
    try {
        const { id } = req.params;
        const { description, amount, category, date } = req.body;
        const expense = await expenseModel_1.default.findByIdAndUpdate({ _id: id, userId }, { description, amount, category, date }, { new: true });
        res.status(200).json({
            status: "success",
            message: "Expense updated successfully",
            expense,
        });
    }
    catch (error) {
        res
            .status(400)
            .json({ status: "error", message: error.message });
    }
};
exports.updateExpense = updateExpense;
// delete expense
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId; // from auth middleware
        const expense = await expenseModel_1.default.findByIdAndDelete({ _id: id, userId });
        res.status(200).json({
            status: "success",
            message: "Expense deleted successfully",
            expense,
        });
    }
    catch (error) {
        res
            .status(400)
            .json({ status: "error", message: error.message });
    }
};
exports.deleteExpense = deleteExpense;
// export all expenses as csv
const exportExpensesAsCSV = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware
        const expenses = await expenseModel_1.default.find({ userId }).sort({ date: -1 });
        const csvData = expenses.map((expense) => ({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
        }));
        res.status(200).json({
            status: "success",
            message: "Expenses exported as CSV",
            data: csvData,
        });
    }
    catch (error) {
        res
            .status(400)
            .json({ status: "error", message: error.message });
    }
};
exports.exportExpensesAsCSV = exportExpensesAsCSV;
