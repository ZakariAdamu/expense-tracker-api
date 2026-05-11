import mongoose from "mongoose";
import { userInfo } from "os";

const expenseSchema = new mongoose.Schema(
	{
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
			type: mongoose.Schema.Types.ObjectId,
			ref: "user",
			required: true, // expense for a particular user
		},
		type: {
			type: String,
			enum: ["expense"],
			default: "expense",
			required: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

const expenseModel = mongoose.model("Expense", expenseSchema);

export default expenseModel;
