import incomeModel from "../models/incomeModel";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

function isMongoConnected() {
	return mongoose.connection.readyState === 1;
}

type MemoryIncome = {
	_id: string;
	description: string;
	amount: number;
	category: string;
	date: Date;
	type: "income";
};

const fallbackIncomes: MemoryIncome[] = [
	{
		_id: randomUUID(),
		description: "Consulting Payment",
		amount: 4200,
		category: "Consulting",
		date: new Date("2026-04-01T10:00:00.000Z"),
		type: "income",
	},
	{
		_id: randomUUID(),
		description: "Dividend Distribution",
		amount: 860,
		category: "Investments",
		date: new Date("2026-03-25T10:00:00.000Z"),
		type: "income",
	},
];

function toDate(value: unknown, fallback: Date) {
	if (!value) return fallback;
	const date = new Date(String(value));
	return Number.isNaN(date.getTime()) ? fallback : date;
}

function toAmount(value: unknown) {
	const amount = Number(value);
	return Number.isFinite(amount) ? amount : NaN;
}

function missingRequiredIncomeFields(
	description: unknown,
	amount: unknown,
	category: unknown,
) {
	return !description || amount === undefined || amount === null || !category;
}

function getMonthRange(month: unknown, year: unknown) {
	const monthNumber = Number(month);
	const yearNumber = Number(year);

	if (
		!Number.isInteger(monthNumber) ||
		monthNumber < 1 ||
		monthNumber > 12 ||
		!Number.isInteger(yearNumber) ||
		yearNumber < 1900
	) {
		return null;
	}

	const startDate = new Date(yearNumber, monthNumber - 1, 1);
	const endDate = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);

	return { startDate, endDate };
}

function sortByDateDesc<T extends { date: Date }>(items: T[]) {
	return [...items].sort((a, b) => b.date.getTime() - a.date.getTime());
}

// add income

export const addIncome = async (req: any, res: any) => {
	try {
		const { description, amount, category, date } = req.body;

		if (missingRequiredIncomeFields(description, amount, category)) {
			return res.status(400).json({
				message: "description, amount, and category are required",
			});
		}

		const parsedAmount = toAmount(amount);
		if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
			return res.status(400).json({ message: "amount must be a number >= 0" });
		}

		if (!isMongoConnected()) {
			const income: MemoryIncome = {
				_id: randomUUID(),
				description: String(description),
				amount: parsedAmount,
				category: String(category),
				date: toDate(date, new Date()),
				type: "income",
			};

			fallbackIncomes.push(income);
			return res.status(201).json(income);
		}

		const income = new incomeModel({
			description,
			amount: parsedAmount,
			category,
			date: toDate(date, new Date()),
		});
		await income.save();
		res.status(201).json(income);
	} catch (error) {
		res.status(400).json({ message: "Server error", error });
	}
};

// get all incomes

export const getAllIncomes = async (req: any, res: any) => {
	try {
		if (!isMongoConnected()) {
			return res.status(200).json(sortByDateDesc(fallbackIncomes));
		}

		const incomes = await incomeModel.find().sort({ date: -1 });
		res.status(200).json(incomes);
	} catch (error) {
		res.status(400).json({ message: "Server error", error });
	}
};

// update an income

export const updateIncome = async (req: any, res: any) => {
	try {
		const { id } = req.params;
		const { description, amount, category, date } = req.body;

		if (!isMongoConnected()) {
			const index = fallbackIncomes.findIndex((income) => income._id === id);
			if (index === -1) {
				return res.status(404).json({ message: "Income not found" });
			}

			const current = fallbackIncomes[index];
			const nextAmount =
				amount === undefined ? current.amount : toAmount(amount);

			if (Number.isNaN(nextAmount) || nextAmount < 0) {
				return res
					.status(400)
					.json({ message: "amount must be a number >= 0" });
			}

			const updated: MemoryIncome = {
				...current,
				description:
					description === undefined ? current.description : String(description),
				amount: nextAmount,
				category: category === undefined ? current.category : String(category),
				date: date === undefined ? current.date : toDate(date, current.date),
			};

			fallbackIncomes[index] = updated;
			return res.status(200).json(updated);
		}

		const updatedIncome = await incomeModel.findByIdAndUpdate(
			id,
			{
				description,
				amount: amount === undefined ? undefined : toAmount(amount),
				category,
				date: date === undefined ? undefined : toDate(date, new Date()),
			},
			{ new: true },
		);

		if (!updatedIncome) {
			return res.status(404).json({ message: "Income not found" });
		}

		res.status(200).json(updatedIncome);
	} catch (error) {
		res.status(400).json({ message: "Server error", error });
	}
};

// delete an income

export const deleteIncome = async (req: any, res: any) => {
	try {
		const { id } = req.params;

		if (!isMongoConnected()) {
			const index = fallbackIncomes.findIndex((income) => income._id === id);
			if (index === -1) {
				return res.status(404).json({ message: "Income not found" });
			}

			fallbackIncomes.splice(index, 1);
			return res.status(200).json({ message: "Income deleted successfully" });
		}

		await incomeModel.findByIdAndDelete(id);
		res.status(200).json({ message: "Income deleted successfully" });
	} catch (error) {
		res.status(400).json({ message: "Unable to delete income", error });
	}
};

// csv export

export const exportIncomesToCSV = async (req: any, res: any) => {
	try {
		const incomes = !isMongoConnected()
			? sortByDateDesc(fallbackIncomes)
			: await incomeModel.find().sort({ date: -1 });

		const csvData = [
			["Description", "Amount", "Category", "Date"],
			...incomes.map((income) => [
				String(income.description),
				String(income.amount),
				String(income.category),
				new Date(income.date).toISOString(),
			]),
		]
			.map((row) => row.join(","))
			.join("\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", "attachment; filename=incomes.csv");
		res.status(200).send(csvData);
	} catch (error) {
		res.status(400).json({ message: "Server error", error });
	}
};

// get total income for a specific month and year

export const getTotalIncomeByMonth = async (req: any, res: any) => {
	try {
		const { month, year } = req.query;
		const range = getMonthRange(month, year);

		if (!range) {
			return res.status(400).json({
				message: "month and year must be valid numbers (month: 1-12)",
			});
		}

		const { startDate, endDate } = range;

		if (!isMongoConnected()) {
			const totalIncome = fallbackIncomes
				.filter((income) => income.date >= startDate && income.date <= endDate)
				.reduce((sum, income) => sum + income.amount, 0);

			return res.status(200).json({ totalIncome });
		}

		const totalIncome = await incomeModel.aggregate([
			{
				$match: {
					date: { $gte: startDate, $lte: endDate },
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: "$amount" },
				},
			},
		]);
		res.status(200).json({ totalIncome: totalIncome[0]?.total || 0 });
	} catch (error) {
		res.status(400).json({ message: "Server error", error });
	}
};
