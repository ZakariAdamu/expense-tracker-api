import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
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
	type: {
		type: String,
		enum: ["expense"],
		default: "expense",
		required: false,
	},
});

const expenseModel = mongoose.model("Expense", expenseSchema);

export default expenseModel;
