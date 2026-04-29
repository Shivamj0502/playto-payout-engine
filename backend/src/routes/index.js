import express from "express";
import payoutRoutes from "./payout.routes.js";

const router = express.Router();

router.use("/payouts", payoutRoutes);

console.log("Routes loaded");

export default router;