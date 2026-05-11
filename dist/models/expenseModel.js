"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const expenseSchema = new mongoose_1.default.Schema({
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "user",
        required: true, // expense for a particular user
    },
    type: {
        type: String,
        enum: ["expense"],
        default: "expense",
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const expenseModel = mongoose_1.default.model("Expense", expenseSchema);
exports.default = expenseModel;
