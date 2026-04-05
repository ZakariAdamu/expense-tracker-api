import expenseModel from "../models/expenseModel";

// add expense

export const addExpense = async (req: any, res: any) => {
	try {
		const { description, amount, category, date } = req.body;
		const expense = new expenseModel({
			description,
			amount,
			category,
			date,
		});
		await expense.save();
		res.status(201).json(expense);
	} catch (error) {
		res.status(400).json({ message: (error as Error).message });
	}
};

// get all expenses
export const getAllExpenses = async (req: any, res: any) => {
	try {
		const expenses = await expenseModel.find();
		res.status(200).json(expenses);
	} catch (error) {
		res.status(400).json({ message: (error as Error).message });
	}
};

// update expense
export const updateExpense = async (req: any, res: any) => {
	try {
		const { id } = req.params;
		const { description, amount, category, date } = req.body;
		const expense = await expenseModel.findByIdAndUpdate(
			id,
			{ description, amount, category, date },
			{ new: true },
		);
		res.status(200).json(expense);
	} catch (error) {
		res.status(400).json({ message: (error as Error).message });
	}
};

// delete expense
export const deleteExpense = async (req: any, res: any) => {
	try {
		const { id } = req.params;
		const expense = await expenseModel.findByIdAndDelete(id);
		res.status(200).json(expense);
	} catch (error) {
		res.status(400).json({ message: (error as Error).message });
	}
};

// export all expenses as csv
export const exportExpensesAsCSV = async (req: any, res: any) => {
	try {
		const expenses = await expenseModel.find();
		const csvData = expenses.map((expense) => ({
			description: expense.description,
			amount: expense.amount,
			category: expense.category,
			date: expense.date,
		}));
		res.status(200).json(csvData);
	} catch (error) {
		res.status(400).json({ message: (error as Error).message });
	}
};
