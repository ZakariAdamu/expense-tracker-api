import type { Types } from "mongoose";
import { Schema, model } from "mongoose";

export interface IExpense {
	amount: number;
	description: string;
	date: Date;
	category: string;
	userId?: Types.ObjectId;
	type: "expense";
}

const expenseSchema = new Schema<IExpense>(
	{
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		date: {
			type: Date,
			required: true,
			default: Date.now,
		},
		category: {
			type: String,
			required: true,
			trim: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true, // expense for a particular user
			index: true,
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

const expenseModel = model<IExpense>("Expense", expenseSchema);

export default expenseModel;
