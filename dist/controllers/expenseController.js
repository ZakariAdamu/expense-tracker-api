"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExpensesAsCSV = exports.deleteExpense = exports.updateExpense = exports.getAllExpenses = exports.addExpense = void 0;
const expenseModel_1 = __importDefault(require("../models/expenseModel"));
// add expense
const addExpense = async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        const expense = new expenseModel_1.default({
            description,
            amount,
            category,
            date,
        });
        await expense.save();
        res.status(201).json(expense);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.addExpense = addExpense;
// get all expenses
const getAllExpenses = async (req, res) => {
    try {
        const expenses = await expenseModel_1.default.find();
        res.status(200).json(expenses);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getAllExpenses = getAllExpenses;
// update expense
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, category, date } = req.body;
        const expense = await expenseModel_1.default.findByIdAndUpdate(id, { description, amount, category, date }, { new: true });
        res.status(200).json(expense);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateExpense = updateExpense;
// delete expense
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await expenseModel_1.default.findByIdAndDelete(id);
        res.status(200).json(expense);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteExpense = deleteExpense;
// export all expenses as csv
const exportExpensesAsCSV = async (req, res) => {
    try {
        const expenses = await expenseModel_1.default.find();
        const csvData = expenses.map((expense) => ({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
        }));
        res.status(200).json(csvData);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.exportExpensesAsCSV = exportExpensesAsCSV;
