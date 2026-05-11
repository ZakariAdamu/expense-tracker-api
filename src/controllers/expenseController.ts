import expenseModel from "../models/expenseModel";

// add expense

export const addExpense = async (req: any, res: any) => {
	const userId = req.userId; // from auth middleware
	try {
		const { description, amount, category, date } = req.body;
		const expense = new expenseModel({
			userId,
			description,
			amount,
			category,
			date,
		});
		await expense.save();
		res.status(201).json({
			status: "success",
			message: "Expense added successfully",
			expense,
		});
	} catch (error) {
		res
			.status(400)
			.json({ status: "error", message: (error as Error).message });
	}
};

// get all expenses
export const getAllExpenses = async (req: any, res: any) => {
	const userId = req.userId; // from auth middleware
	try {
		const expenses = await expenseModel.find({ userId }).sort({ date: -1 });
		res.status(200).json({ status: "success", expenses });
	} catch (error) {
		res
			.status(400)
			.json({ status: "error", message: (error as Error).message });
	}
};

// update expense
export const updateExpense = async (req: any, res: any) => {
	const userId = req.userId; // from auth middleware
	try {
		const { id } = req.params;
		const { description, amount, category, date } = req.body;
		const expense = await expenseModel.findOneAndUpdate(
			{ _id: id, userId },
			{ description, amount, category, date },
			{ new: true },
		);
		res.status(200).json({
			status: "success",
			message: "Expense updated successfully",
			expense,
		});
	} catch (error) {
		res
			.status(400)
			.json({ status: "error", message: (error as Error).message });
	}
};

// delete expense
export const deleteExpense = async (req: any, res: any) => {
	try {
		const { id } = req.params;
		const userId = req.userId; // from auth middleware
		const expense = await expenseModel.findOneAndDelete({ _id: id, userId });
		res.status(200).json({
			status: "success",
			message: "Expense deleted successfully",
			expense,
		});
	} catch (error) {
		res
			.status(400)
			.json({ status: "error", message: (error as Error).message });
	}
};

// export all expenses as csv
export const exportExpensesAsCSV = async (req: any, res: any) => {
	try {
		const userId = req.userId; // from auth middleware
		const expenses = await expenseModel.find({ userId }).sort({ date: -1 });
		const csvData = expenses.map((expense) => ({
			description: expense.description,
			amount: expense.amount,
			category: expense.category,
			date: expense.date,
		}));
		res.status(200).json({
			status: "success",
			message: "Expenses exported as CSV",
			data: csvData,
		});
	} catch (error) {
		res
			.status(400)
			.json({ status: "error", message: (error as Error).message });
	}
};
