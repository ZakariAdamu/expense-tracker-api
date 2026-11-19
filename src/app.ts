import fs from "node:fs";
import path from "node:path";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { isHttpError } from "./lib/http-error.js";
import { sendError, sendSuccess } from "./lib/response.js";

// Routes
import dashboardRouter from "./routes/dashboardRoute.js";
import expenseRouter from "./routes/expenseRoute.js";
import { healthRouter } from "./routes/health.js";
import incomeRouter from "./routes/incomeRoute.js";
import { summaryRouter } from "./routes/summary.js";
import userRouter from "./routes/userRoute.js";

// Load OpenAPI spec once at module startup instead of inside createApp()
let swaggerSpec: Record<string, unknown> | null = null;
try {
  const openapiPath = path.resolve(process.cwd(), "openapi", "openapi.json");
  if (fs.existsSync(openapiPath)) {
    swaggerSpec = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
  }
} catch (err) {
  console.warn("Could not load OpenAPI spec:", err);
}

export function createApp() {
  const app = express();

  // 1. ======== Core App Settings (Must come first) ========
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Crucial for Render HTTPS cookies & accurate rate-limit IPs
  app.set("port", env.port);
  app.set("host", env.host);

  // 2. ======== Security Headers ========
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // 3. ======== CORS & Preflight (Must come before rate limiters & routes) ========
  // Normalize origins by stripping any accidental trailing slashes
  const normalizedOrigins = env.allowedOrigins.map((origin) =>
    origin.replace(/\/+$/, ""),
  );

  const corsOrigin =
    normalizedOrigins.length > 0
      ? normalizedOrigins
      : env.nodeEnv === "production"
        ? false
        : true;

  const corsOptions: cors.CorsOptions = {
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Refresh-Token"],
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // 4. ======== Compression & Parsers ========
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // 5. ======== Rate Limiters ========
  const authLimiter = rateLimit({
    windowMs: 45 * 60 * 1000, // 45 minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: "error",
      message: "Too many auth attempts, please try again later.",
    },
  });

  const refreshLimiter = rateLimit({
    windowMs: 45 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: "error",
      message: "Too many refresh attempts, please try again later.",
    },
  });

  app.use("/api/users/login", authLimiter);
  app.use("/api/users/signup", authLimiter);
  app.use("/api/users/refresh", refreshLimiter);

  // 6. ======== Health & Root Routes ========
  app.get("/", (_req: Request, res: Response) => {
    sendSuccess(res, 200, "Backend is healthy", {
      service: "finance-pro-backend",
      version: process.env.npm_package_version || "1.0.0",
      status: "running",
      port: app.get("port"),
      host: app.get("host"),
    });
  });

  app.use("/api/health", healthRouter);

  // 7. ======== Application API Routes ========
  app.use("/api/users", userRouter);
  app.use("/api/summary", summaryRouter);
  app.use("/api/income", incomeRouter);
  app.use("/api/expenses", expenseRouter);
  app.use("/api/dashboard", dashboardRouter);

  // 8. ======== API Docs (Swagger UI) ========
  if (swaggerSpec) {
    // Relax CSP strictly on /docs so Swagger UI scripts/styles aren't blocked by Helmet
    app.use(
      "/docs",
      helmet({ contentSecurityPolicy: false }),
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, { explorer: true }),
    );
  }

  // 9. ======== 404 Handler ========
  app.use((_req: Request, res: Response) => {
    sendError(res, 404, "Route not found");
  });

  // 10. ======== Global Error Handler (Must come last) ========
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (res.headersSent) {
        return;
      }

      if (isHttpError(error)) {
        return sendError(res, error.statusCode, error.message, error.details);
      }

      if (error instanceof ZodError) {
        return sendError(res, 400, "Validation failed", {
          issues: error.flatten(),
        });
      }

      if (error instanceof jwt.TokenExpiredError) {
        return sendError(res, 401, "Token has expired");
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return sendError(res, 401, "Invalid token");
      }

      console.error("Unhandled Error:", error);
      return sendError(res, 500, "Internal server error", {
        ...(env.nodeEnv === "development" &&
        error instanceof Error &&
        error.stack
          ? { stack: error.stack }
          : {}),
      });
    },
  );

  return app;
}
