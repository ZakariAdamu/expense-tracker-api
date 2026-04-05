"use client";

import {
	Utensils,
	Home,
	Car,
	ShoppingCart,
	Gift,
	Zap,
	Activity,
	ArrowUp,
	CreditCard,
	PiggyBank,
	DollarSign,
	ArrowDown,
	TrendingUp,
	Clock,
	RefreshCw,
	Info,
	ChevronUp,
	ChevronDown,
	PieChart,
} from "lucide-react";
import { styles } from "./assets/styles";
import { useSidebar } from "./context/SidebarContext";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import axios from "axios";

const API_BASE_URL = (
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const CATEGORY_ICONS: Record<string, ReactNode> = {
	Food: <Utensils className="w-4 h-4" />,
	Housing: <Home className="w-4 h-4" />,
	Transport: <Car className="w-4 h-4" />,
	Shopping: <ShoppingCart className="w-4 h-4" />,
	Entertainment: <Gift className="w-4 h-4" />,
	Utilities: <Zap className="w-4 h-4" />,
	Healthcare: <Activity className="w-4 h-4" />,
	Salary: <ArrowUp className="w-4 h-4" />,
	Freelance: <CreditCard className="w-4 h-4" />,
	Savings: <PiggyBank className="w-4 h-4" />,
};

// filtering categories

type TransactionLike = {
	date: string | Date;
};

type TimeFrame = "daily" | "weekly" | "monthly";

const filterTransactions = <T extends TransactionLike>(
	transactions: T[],
	frame: TimeFrame,
): T[] => {
	const now = new Date();
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);
	const todayTime = today.getTime();

	switch (frame) {
		case "daily":
			return transactions.filter(
				(t) => new Date(t.date).getTime() >= todayTime,
			);
		case "weekly": {
			const startOfWeek = new Date(todayTime);
			startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
			const startOfWeekTime = startOfWeek.getTime();
			return transactions.filter(
				(t) => new Date(t.date).getTime() >= startOfWeekTime,
			);
		}
		case "monthly":
			return transactions.filter(
				(t) =>
					new Date(t.date).getMonth() === now.getMonth() &&
					new Date(t.date).getFullYear() === now.getFullYear(),
			);
		default:
			return transactions;
	}
};

type ApiArrayBody<T> = {
	data?: T[];
	incomes?: T[];
	expenses?: T[];
};

type ApiResponse<T> = {
	data?: T[] | ApiArrayBody<T>;
};

type RawTransaction = {
	_id?: string | number;
	id?: string | number;
	id_str?: string | number;
	description?: string;
	title?: string;
	note?: string;
	amount?: number | string | null;
	value?: number | string | null;
	date?: string;
	createdAt?: string;
	category?: string;
	type?: string;
	[key: string]: unknown;
};

type NormalizedTransaction = {
	id: string;
	description: string;
	amount: number;
	date: string;
	category: string;
	type: "income" | "expense";
	raw: RawTransaction;
};

const safeArrayFromResponse = <T = unknown,>(
	res: ApiResponse<T> | null | undefined,
): T[] => {
	const body = res?.data;
	if (!body) return [];
	if (Array.isArray(body)) return body;
	if (Array.isArray(body.data)) return body.data;
	if (Array.isArray(body.incomes)) return body.incomes;
	if (Array.isArray(body.expenses)) return body.expenses;
	return [];
};

export default function HomePage() {
	const { sidebarCollapsed } = useSidebar();
	const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
	const [timeFrame, setTimeFrame] = useState("monthly");
	const [loading, setLoading] = useState(false);
	const [showAllTransactions, setShowAllTransactions] = useState(false);
	const [lastUpdated, setLastUpdated] = useState(new Date());

	// fetch transactions from backend
	const fetchTransactions = async () => {
		try {
			setLoading(true);

			const [incomeRes, expenseRes] = await Promise.all([
				axios.get(`${API_BASE_URL}/incomes`),
				axios.get(`${API_BASE_URL}/expenses`),
			]);

			const incomes = safeArrayFromResponse<RawTransaction>(incomeRes).map(
				(i) => ({
					...i,
					type: "income" as const,
				}),
			);
			const expenses = safeArrayFromResponse<RawTransaction>(expenseRes).map(
				(e) => ({
					...e,
					type: "expense" as const,
				}),
			);

			const allTransactions: NormalizedTransaction[] = [...incomes, ...expenses]
				.map((t) => ({
					id: String(
						t._id ?? t.id ?? t.id_str ?? Math.random().toString(36).slice(2),
					),
					description: String(t.description ?? t.title ?? t.note ?? ""),
					amount: t.amount != null ? Number(t.amount) : Number(t.value) || 0,
					date: String(t.date ?? t.createdAt ?? new Date().toISOString()),
					category: String(t.category ?? t.type ?? "Other"),
					type: t.type,
					raw: t,
				}))
				.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				);

			setTransactions(allTransactions);
			setLastUpdated(new Date());
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				console.error(
					"Failed to fetch transactions",
					err.response?.data ?? err.message,
				);
			} else {
				console.error("Failed to fetch transactions", err);
			}
		} finally {
			setLoading(false);
		}
	};

	const addTransaction = async (transaction: RawTransaction) => {
		try {
			const endpoint = transaction.type === "income" ? "income" : "expense";
			await axios.post(`${API_BASE_URL}/${endpoint}`, transaction);
			await fetchTransactions();
			return true;
		} catch (err) {
			console.error(
				"Failed to add transaction",
				axios.isAxiosError(err) ? (err.response?.data ?? err.message) : err,
				err,
			);
			throw err;
		}
	};

	// update transaction
	const editTransaction = async (
		id: string | number,
		transaction: RawTransaction,
	) => {
		try {
			const endpoint =
				transaction.type === "income" ? "income/update" : "expense/update";
			await axios.put(`${API_BASE_URL}/${endpoint}/${id}`, transaction);
			await fetchTransactions();
			return true;
		} catch (err) {
			console.error(
				"Failed to edit transaction",
				axios.isAxiosError(err) ? (err.response?.data ?? err.message) : err,
				err,
			);
			throw err;
		}
	};

	const deleteTransaction = async (
		id: string | number,
		type: "income" | "expense",
	) => {
		try {
			const endpoint = type === "income" ? "income/delete" : "expense/delete";
			await axios.delete(`${API_BASE_URL}/${endpoint}/${id}`);
			await fetchTransactions();
			return true;
		} catch (err) {
			console.error(
				"Failed to delete transaction",
				axios.isAxiosError(err) ? (err.response?.data ?? err.message) : err,
				err,
			);
			throw err;
		}
	};

	useEffect(() => {
		const load = async () => {
			try {
				await fetchTransactions();
			} catch (err) {
				console.error(err);
			}
		};

		load();
	}, []);

	// filter transactions based on selected time frame
	const filteredTransactions = useMemo(
		() => filterTransactions(transactions, timeFrame as TimeFrame),
		[transactions, timeFrame],
	);

	const stats = useMemo(() => {
		const now = new Date();
		const thirtyDaysAgo = new Date(now);
		thirtyDaysAgo.setDate(now.getDate() - 30);

		const last30DaysTransactions = transactions.filter(
			(t) => new Date(t.date) >= thirtyDaysAgo,
		);

		const last30DaysIncome = last30DaysTransactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const last30DaysExpenses = last30DaysTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const allTimeIncome = transactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const allTimeExpenses = transactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const savingsRate =
			last30DaysIncome > 0
				? Math.round(
						((last30DaysIncome - last30DaysExpenses) / last30DaysIncome) * 100,
					)
				: 0;

		const last60DaysAgo = new Date(now);
		last60DaysAgo.setDate(now.getDate() - 60);

		const previous30DaysTransactions = transactions.filter((t) => {
			const date = new Date(t.date);
			return date >= last60DaysAgo && date < thirtyDaysAgo;
		});

		const previous30DaysExpenses = previous30DaysTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const expenseChange =
			previous30DaysExpenses > 0
				? Math.round(
						((last30DaysExpenses - previous30DaysExpenses) /
							previous30DaysExpenses) *
							100,
					)
				: 0;

		return {
			totalTransactions: transactions.length,
			last30DaysIncome,
			last30DaysExpenses,
			last30DaysSavings: last30DaysIncome - last30DaysExpenses,
			allTimeIncome,
			allTimeExpenses,
			allTimeSavings: allTimeIncome - allTimeExpenses,
			last30DaysCount: last30DaysTransactions.length,
			savingsRate,
			expenseChange,
		};
	}, [transactions]);

	const timeFrameLabel = useMemo(
		() =>
			timeFrame === "daily"
				? "Today"
				: timeFrame === "weekly"
					? "This Week"
					: "This Month",
		[timeFrame],
	);

	const outletContext = {
		transactions: filteredTransactions,
		addTransaction,
		editTransaction,
		deleteTransaction,
		refreshTransactions: fetchTransactions,
		timeFrame,
		setTimeFrame,
		lastUpdated,
	};

	const getSavingsRating = (rate: number) =>
		rate > 30 ? "Excellent" : rate > 20 ? "Good" : "Needs improvement";

	// calculate top 5 categories
	const topCategories = useMemo(
		() =>
			Object.entries(
				transactions
					.filter((t) => t.type === "expense")
					.reduce((acc: Record<string, number>, t) => {
						acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
						return acc;
					}, {}),
			)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5),
		[transactions],
	);

	const displayedTransactions = showAllTransactions
		? transactions
		: transactions.slice(0, 4);

	return (
		<div className={styles.layout.mainContainer(sidebarCollapsed)}>
			<div className={styles.header.container}>
				<div>
					<h1 className="Welcome">Dashboard main</h1>
					<p className={styles.header.subtitle}>Welcome Back</p>
				</div>
			</div>
			<div className={styles.statCards.grid}>
				<div className={styles.statCards.card}>
					<div className={styles.statCards.cardHeader}>
						<div className="">
							<p className={styles.statCards.cardTitle}>Total Balance</p>
							<p className={styles.statCards.cardValue}>
								$
								{stats.allTimeSavings.toLocaleString("en-US", {
									minimumFractionDigits: 2,
								})}
							</p>
						</div>
						<div className={styles.statCards.iconContainer("teal")}>
							<DollarSign size={24} className={styles.statCards.icon("teal")} />
						</div>
					</div>
					<p className={styles.statCards.cardFooter}>
						<span className="text-teal-600 font-medium">
							+$
							{stats.last30DaysSavings.toLocaleString("en-US", {
								minimumFractionDigits: 2,
							})}
						</span>{" "}
						this month
					</p>
				</div>

				{/*monthly income */}

				<div className={styles.statCards.card}>
					<div className={styles.statCards.cardHeader}>
						<div className="">
							<p className={styles.statCards.cardTitle}>Monthly Income</p>
							<p className={styles.statCards.cardValue}>
								$
								{stats.last30DaysIncome.toLocaleString("en-US", {
									minimumFractionDigits: 2,
								})}
							</p>
						</div>
						<div className={styles.statCards.iconContainer("green")}>
							<ArrowUp size={24} className={styles.statCards.icon("green")} />
						</div>
					</div>
					<p className={styles.statCards.cardFooter}>
						<span className="text-green-600 font-medium">+12.5%</span> from last
						month
					</p>
				</div>
				{/* monthly expenses */}
				<div className={styles.statCards.card}>
					<div className={styles.statCards.cardHeader}>
						<div className="">
							<p className={styles.statCards.cardTitle}>Monthly Expenses</p>
							<p className={styles.statCards.cardValue}>
								$
								{stats.last30DaysExpenses.toLocaleString("en-US", {
									minimumFractionDigits: 2,
								})}
							</p>
						</div>
						<div className={styles.statCards.iconContainer("orange")}>
							<ArrowDown
								size={24}
								className={styles.statCards.icon("orange")}
							/>
						</div>
					</div>
					<p className={styles.statCards.cardFooter}>
						<span
							className={`${styles.colors.expenseChange(stats.expenseChange)} font-medium`}
						>
							{stats.expenseChange > 0 ? "+" : ""}
							{stats.expenseChange}%
						</span>{" "}
						from last month
					</p>
				</div>

				{/* savings rate */}

				<div className={styles.statCards.card}>
					<div className={styles.statCards.cardHeader}>
						<div className="">
							<p className={styles.statCards.cardTitle}>Saving Rate</p>
							<p className={styles.statCards.cardValue}>
								${stats.savingsRate}%
							</p>
						</div>
						<div className={styles.statCards.iconContainer("blue")}>
							<PiggyBank size={24} className={styles.statCards.icon("blue")} />
						</div>
					</div>
					<p className={styles.statCards.cardFooter}>
						{getSavingsRating(stats.savingsRate)}
					</p>
				</div>
			</div>
			<div className={styles.grid.main}>
				<div className={styles.grid.leftColumn}>
					<div className={styles.cards.base}>
						<div className={styles.cards.header}>
							<h3 className={styles.cards.title}>
								{" "}
								<TrendingUp className="w-6 h-6 text-teal-500" />
								Financial Overview
								<span className="text-sm text-gray-500 font-normal">
									{timeFrameLabel}
								</span>
							</h3>
						</div>
						<div className="space-y-3">
							<p className="text-sm text-gray-600">
								Showing {outletContext.transactions.length} transactions
							</p>
						</div>
					</div>
				</div>

				{/* right side */}

				<div className={styles.grid.rightColumn}>
					<div className={styles.cards.base}>
						<div className={styles.transactions.cardHeader}>
							<h3 className={styles.transactions.cardTitle}>
								<Clock size={20} className="text-purple-500" />
								Recent Transactions
							</h3>
							<button
								onClick={fetchTransactions}
								disabled={loading}
								className={styles.transactions.refreshButton}
							>
								<RefreshCw
									className={styles.transactions.refreshIcon(loading)}
									size={20}
								/>
							</button>
						</div>
						<div className={styles.transactions.dataStackingInfo}>
							<Info className={styles.transactions.dataStackingIcon} />
							<span>Transactions are stacked by date (newest first)</span>
						</div>
						<div className={styles.transactions.listContainer}>
							{displayedTransactions.map((transaction) => {
								const { id, description, amount, category, type, date } =
									transaction;
								return (
									<div key={id} className={styles.transactions.transactionItem}>
										<div className="flex items-center gap-1 md:gap-4 lg:gap-3">
											<div
												className={`p-2 rounded-lg ${styles.colors.transaction.bg(type)}`}
											>
												{CATEGORY_ICONS[category] ?? (
													<DollarSign className={styles.transactions.icon} />
												)}
											</div>
											<div className={styles.transactions.details}>
												<p className={styles.transactions.description}>
													{description}
												</p>
												<p className={styles.transactions.meta}>
													{new Date(date).toLocaleDateString()}
													<span className="ml-2 capitalize">{category}</span>
												</p>
											</div>
										</div>
										<span className={styles.colors.transaction.text(type)}>
											{type === "income" ? "+" : "-"}$
											{Number(amount).toLocaleString("en-US", {
												minimumFractionDigits: 2,
											})}
										</span>
									</div>
								);
							})}
							{transactions.length === 0 ? (
								<div className={styles.transactions.emptyState}>
									<div className={styles.transactions.emptyIconContainer}>
										<Clock className={styles.transactions.emptyIcon} />
									</div>
									<p className={styles.transactions.emptyText}>
										No recent transactions
									</p>
								</div>
							) : (
								<div className={styles.transactions.viewAllContainer}>
									<button
										onClick={() => setShowAllTransactions(!showAllTransactions)}
										className={styles.transactions.viewAllButton}
									>
										{showAllTransactions ? (
											<>
												<ChevronUp size={20} className="mr-1" />
												Show Less
											</>
										) : (
											<>
												<ChevronDown size={20} />
												View All {transactions.length} Transactions
											</>
										)}
									</button>
								</div>
							)}
						</div>
					</div>
					{/* spending by category card */}
					<div className={styles.cards.base}>
						<h3 className={styles.categories.title}>
							<PieChart size={20} className={styles.categories.titleIcon} />
							Spending by Category
						</h3>
						<div className={styles.categories.list}>
							{topCategories.map(([category, amount]) => (
								<div key={category} className={styles.categories.categoryItem}>
									<div className="flex items-center gap-3">
										<div className={styles.categories.categoryIconContainer}>
											{CATEGORY_ICONS[category] ?? (
												<DollarSign
													className={styles.categories.categoryIcon}
												/>
											)}
										</div>
										<span className={styles.categories.categoryName}>
											{category}
										</span>
									</div>
									<span className={styles.categories.categoryAmount}>
										$
										{amount.toLocaleString("en-US", {
											minimumFractionDigits: 0,
										})}
									</span>
								</div>
							))}
						</div>

						<div className={styles.categories.summaryContainer}>
							<div className={styles.categories.summaryGrid}>
								<div className={styles.categories.summaryIncomeCard}>
									<p className={styles.categories.summaryTitle}>Total Income</p>
									<p className={styles.categories.summaryValue}>
										$
										{stats.allTimeIncome.toLocaleString("en-US", {
											minimumFractionDigits: 2,
										})}
									</p>
								</div>
								<div className={styles.categories.summaryExpenseCard}>
									<p className={styles.categories.summaryTitle}>
										Total Expenses
									</p>
									<p className={styles.categories.summaryValue}>
										$
										{stats.allTimeExpenses.toLocaleString("en-US", {
											minimumFractionDigits: 2,
										})}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
