"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expenseController_1 = require("../controllers/expenseController");
const auth_1 = require("../middleware/auth");
const expenseRouter = express_1.default.Router();
expenseRouter.post("/", auth_1.protect, expenseController_1.addExpense);
expenseRouter.get("/", auth_1.protect, expenseController_1.getAllExpenses);
expenseRouter.put("/:id", auth_1.protect, expenseController_1.updateExpense);
expenseRouter.delete("/:id", auth_1.protect, expenseController_1.deleteExpense);
expenseRouter.get("/export/csv", auth_1.protect, expenseController_1.exportExpensesAsCSV);
exports.default = expenseRouter;
