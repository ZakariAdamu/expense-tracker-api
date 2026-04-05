import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { healthRouter } from "./routes/health";
import { summaryRouter } from "./routes/summary";
import incomeRouter from "./routes/incomeRoute";
import expenseRouter from "./routes/expenseRoute";
import dashboardRouter from "./routes/dashboardRoute";

export function createApp() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	app.get("/", (_request: Request, response: Response) => {
		response.json({
			service: "finance-pro-backend",
			message: "Backend is running",
			endpoints: [
				"GET /health",
				"GET /api/summary",
				"GET /api/incomes",
				"POST /api/incomes",
				"PUT /api/incomes/:id",
				"DELETE /api/incomes/:id",
				"GET /api/incomes/export/csv",
				"GET /api/incomes/totals?month=<1-12>&year=<yyyy>",
				"GET /api/expenses",
				"POST /api/expenses",
				"PUT /api/expenses/:id",
				"DELETE /api/expenses/:id",
				"GET /api/expenses/export/csv",
				"GET /api/dashboard",
				"GET /dashboard",
			],
		});
	});

	// ROUTES

	app.use(healthRouter);
	app.use(summaryRouter);
	app.use(incomeRouter);
	app.use(expenseRouter);
	app.use("/api/dashboard", dashboardRouter);
	app.use("/dashboard", dashboardRouter);
	app.use((_request: Request, response: Response) => {
		response.status(404).json({
			error: "Not found",
		});
	});

	app.use(
		(
			error: unknown,
			_request: Request,
			response: Response,
			_next: NextFunction,
		) => {
			const message =
				error instanceof Error ? error.message : "Unexpected server error";

			response.status(500).json({
				error: message,
			});
		},
	);

	return app;
}
