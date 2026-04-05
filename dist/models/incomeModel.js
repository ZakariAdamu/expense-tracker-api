"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const incomeSchema = new mongoose_1.Schema({
    description: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    // userId: {
    // 	type: Schema.Types.ObjectId,
    // 	ref: "user",
    // 	required: false, // set to true if every income must belong to a user
    // },
    type: {
        type: String,
        enum: ["income"],
        default: "income",
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const incomeModel = mongoose_1.models.Income || (0, mongoose_1.model)("Income", incomeSchema);
exports.default = incomeModel;
