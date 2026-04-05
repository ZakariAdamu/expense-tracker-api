import mongoose, { Schema, model, models, Types } from "mongoose";

export interface IIncome {
	description: string;
	amount: number;
	category: string;
	date: Date;
	userId?: Types.ObjectId;
	type: "income";
}

const incomeSchema = new Schema<IIncome>(
	{
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
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

const incomeModel = models.Income || model<IIncome>("Income", incomeSchema);

export default incomeModel;
