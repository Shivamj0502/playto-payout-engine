import express from "express";
import { createPayoutController, getPayoutsController } from "../controllers/payout.controller.js";

const router = express.Router();

router.post("/", createPayoutController);
router.get("/", getPayoutsController);

export default router;