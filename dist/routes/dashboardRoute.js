import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";
const dashboardRouter = express.Router();
dashboardRouter.get("/", protect, getDashboardData);
export default dashboardRouter;
