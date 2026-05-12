import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet"; // ← Add this
import compression from "compression"; // ← Add this (optional but recommended)

// Import your routes
import { healthRouter } from "./routes/health.ts";
import { summaryRouter } from "./routes/summary.ts";
import incomeRouter from "./routes/incomeRoute.ts";
import expenseRouter from "./routes/expenseRoute.ts";
import dashboardRouter from "./routes/dashboardRoute.ts";
import userRouter from "./routes/userRoute.ts";

export function createApp() {
  const app = express();

  // ====================== MIDDLEWARE ======================

  // 1. Security headers (Very Important)
  app.use(helmet());

  // 2. CORS (Configure allowed origins based on environment)
  // Determine which origin to allow
  const getAllowedOrigins = () => {
    const devUrl = process.env.FRONTEND_DEV_URL;
    const prodUrl = process.env.FRONTEND_PROD_URL;

    if (process.env.NODE_ENV === "production") {
      return prodUrl ? [prodUrl] : [];
    }

    // In development, allow both localhost frontend + production (for testing)
    return [devUrl, prodUrl].filter(Boolean) as string[];
  };

  app.use(
    cors({
      origin: getAllowedOrigins(),
      credentials: true, // ← Important for cookies (JWT)
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // 3. Compression (speeds up responses)
  app.use(compression());

  // 4. Body parsing
  app.use(express.json({ limit: "10mb" })); // Prevent huge payloads
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // 5. Cookie parser
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/users/login", limiter);
  app.use("/api/users/signup", limiter);

  // ====================== BASIC ROUTE ======================
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      service: "finance-pro-backend",
      status: "running",
      version: process.env.npm_package_version || "1.0.0",
      message: "Backend is healthy",
    });
  });

  // ====================== ROUTES ======================
  app.use("/api/health", healthRouter); // Better to mount with prefix
  app.use("/api/users", userRouter);
  app.use("/api/summary", summaryRouter);
  app.use("/api/incomes", incomeRouter);
  app.use("/api/expenses", expenseRouter);
  app.use("/api/dashboard", dashboardRouter);

  // Optional: Keep /dashboard if you serve some HTML/views
  app.use("/dashboard", dashboardRouter);

  // ====================== 404 HANDLER ======================
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" });
  });

  // ====================== GLOBAL ERROR HANDLER ======================
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled Error:", error); // Log for debugging

      const message =
        error instanceof Error ? error.message : "Internal server error";

      res.status(500).json({
        error: message,
        // Only show stack in development
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      });
    },
  );

  return app;
}
