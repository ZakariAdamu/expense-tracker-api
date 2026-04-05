"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeRouter = void 0;
const express_1 = __importDefault(require("express"));
exports.incomeRouter = express_1.default.Router();
const incomeController_1 = require("../controllers/incomeController");
exports.incomeRouter.post("/api/income", incomeController_1.addIncome);
exports.incomeRouter.get("/api/incomes", incomeController_1.getAllIncomes);
exports.incomeRouter.put("/api/incomes/:id", incomeController_1.updateIncome);
exports.incomeRouter.delete("/api/incomes/:id", incomeController_1.deleteIncome);
exports.incomeRouter.get("/api/incomes/export/csv", incomeController_1.exportIncomesToCSV);
exports.incomeRouter.get("/api/incomes/totals", incomeController_1.getTotalIncomeByMonth);
exports.default = exports.incomeRouter;
