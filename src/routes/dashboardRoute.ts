import express from "express";
import { getDashboardData } from "../controllers/dashboardController.ts";
import { protect } from "../middleware/auth.ts";

const dashboardRouter = express.Router();

dashboardRouter.get("/", protect, getDashboardData);
export default dashboardRouter;
