import express from "express";
import { getDashboardData } from "../controllers/dashboardController";

const dashboardRouter = express.Router();

dashboardRouter.get("/", getDashboardData);
export default dashboardRouter;
