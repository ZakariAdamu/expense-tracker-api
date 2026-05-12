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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const expenseModel = model<IExpense>("Expense", expenseSchema);

export default expenseModel;
