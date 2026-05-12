import { Schema, model } from "mongoose";
const expenseSchema = new Schema({
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
        type: Schema.Types.ObjectId,
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
const expenseModel = model("Expense", expenseSchema);
export default expenseModel;
