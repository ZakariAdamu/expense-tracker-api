"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRouter = void 0;
const express_1 = __importDefault(require("express"));
exports.expenseRouter = express_1.default.Router();
const expenseController_1 = require("../controllers/expenseController");
exports.expenseRouter.post("/api/expense", expenseController_1.addExpense);
exports.expenseRouter.get("/api/expenses", expenseController_1.getAllExpenses);
exports.expenseRouter.put("/api/expenses/:id", expenseController_1.updateExpense);
exports.expenseRouter.delete("/api/expenses/:id", expenseController_1.deleteExpense);
exports.expenseRouter.get("/api/expenses/export/csv", expenseController_1.exportExpensesAsCSV);
exports.default = exports.expenseRouter;
