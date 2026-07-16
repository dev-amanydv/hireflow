import express from "express";
import { getDashboardOverview } from "../controllers/dashboard.controller";
import { AsyncHandler } from "../utils/AsyncHandler";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", authMiddleware, AsyncHandler(getDashboardOverview));

export default router;
