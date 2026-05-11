"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const incomeRouter = express_1.default.Router();
const incomeController_1 = require("../controllers/incomeController");
const auth_1 = require("../middleware/auth");
incomeRouter.post("/", auth_1.protect, incomeController_1.addIncome);
incomeRouter.get("/", auth_1.protect, incomeController_1.getAllIncomes);
incomeRouter.put("/:id", auth_1.protect, incomeController_1.updateIncome);
incomeRouter.delete("/:id", auth_1.protect, incomeController_1.deleteIncome);
incomeRouter.get("/export/csv", auth_1.protect, incomeController_1.exportIncomesToCSV);
incomeRouter.get("/totals", auth_1.protect, incomeController_1.getTotalIncomeByMonth);
exports.default = incomeRouter;
