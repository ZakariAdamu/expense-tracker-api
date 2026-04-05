import { createElement } from "react";
import {
	Utensils,
	Home,
	Car,
	ShoppingCart,
	Gift,
	TrendingUp,
	TrendingDown,
	DollarSign,
	BarChart2,
	ArrowUp,
	FileText,
	Briefcase,
	CreditCard,
	ShoppingBag,
	Film,
	Wifi,
	Heart,
} from "lucide-react";

export const GAUGE_COLORS = {
	Income: {
		gradientStart: "#0d9488",
		gradientEnd: "#0f766e",
		text: "text-teal-600",
		bg: "bg-teal-100",
	},
	Spent: {
		gradientStart: "#f97316",
		gradientEnd: "#ea580c",
		text: "text-orange-600",
		bg: "bg-orange-100",
	},
	Savings: {
		gradientStart: "#0891b2",
		gradientEnd: "#0e7490",
		text: "text-cyan-600",
		bg: "bg-cyan-100",
	},
};

export const COLORS = [
	"#0d9488",
	"#0f766e",
	"#0891b2",
	"#0e7490",
	"#f97316",
	"#ea580c",
	"#14b8a6",
];

export const INCOME_COLORS = [
	"#10b981",
	"#34d399",
	"#6ee7b7",
	"#a7f3d0",
	"#d1fae5",
];

export const CATEGORY_ICONS_Inc = {
	Salary: createElement(TrendingUp, { className: "w-4 h-4" }),
	Freelance: createElement(BarChart2, { className: "w-4 h-4" }),
	Investment: createElement(ArrowUp, { className: "w-4 h-4" }),
	Bonus: createElement(FileText, { className: "w-4 h-4" }),
	Other: createElement(DollarSign, { className: "w-4 h-4" }),
};

export const CATEGORY_ICONS = {
	Food: createElement(Utensils, { className: "w-4 h-4" }),
	Housing: createElement(Home, { className: "w-4 h-4" }),
	Transport: createElement(Car, { className: "w-4 h-4" }),
	Shopping: createElement(ShoppingCart, { className: "w-4 h-4" }),
	Entertainment: createElement(Gift, { className: "w-4 h-4" }),
	Utilities: createElement(Home, { className: "w-4 h-4" }),
	Healthcare: createElement(Gift, { className: "w-4 h-4" }),
	Salary: createElement(TrendingUp, { className: "w-4 h-4" }),
	Freelance: createElement(TrendingDown, { className: "w-4 h-4" }),
	Other: createElement(DollarSign, { className: "w-4 h-4" }),
};

// Enhanced category icons with more specific icons for income categories
export const INCOME_CATEGORY_ICONS = {
	Salary: createElement(Briefcase, { className: "w-5 h-5 text-green-500" }),
	Freelance: createElement(CreditCard, { className: "w-5 h-5 text-green-500" }),
	Investment: createElement(TrendingUp, {
		className: "w-5 h-5 text-green-500",
	}),
	Gift: createElement(Gift, { className: "w-5 h-5 text-green-500" }),
	Other: createElement(DollarSign, { className: "w-5 h-5 text-green-500" }),
};

export const EXPENSE_CATEGORY_ICONS = {
	Food: createElement(Utensils, { className: "w-5 h-5 text-orange-500" }),
	Housing: createElement(Home, { className: "w-5 h-5 text-orange-500" }),
	Transport: createElement(Car, { className: "w-5 h-5 text-orange-500" }),
	Shopping: createElement(ShoppingBag, {
		className: "w-5 h-5 text-orange-500",
	}),
	Entertainment: createElement(Film, { className: "w-5 h-5 text-orange-500" }),
	Utilities: createElement(Wifi, { className: "w-5 h-5 text-orange-500" }),
	Healthcare: createElement(Heart, { className: "w-5 h-5 text-orange-500" }),
	Other: createElement(ShoppingCart, { className: "w-5 h-5 text-orange-500" }),
};

export const colorClasses = {
	income: {
		bg: "bg-teal-100",
		text: "text-teal-600",
		border: "border-teal-200",
		ring: "ring-teal-500",
		button: "bg-teal-500 hover:bg-teal-600 text-white",
		iconBg: "bg-teal-100 text-teal-600",
	},
	expense: {
		bg: "bg-orange-100",
		text: "text-orange-600",
		border: "border-orange-200",
		ring: "ring-orange-500",
		button: "bg-orange-500 hover:bg-orange-600 text-white",
		iconBg: "bg-orange-100 text-orange-600",
	},
};
