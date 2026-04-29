import { createPayout } from "../services/payout.service.js";
import { db } from "../config/db.js";
import { payouts } from "../models/payout.model.js";
import { ledger } from "../models/ledger.model.js";
import { eq, sql } from "drizzle-orm";

export async function createPayoutController(req, res, next) {
    try {
        const { amount } = req.body;
        const merchantId = req.headers["x-merchant-id"];
        const idempotencyKey = req.headers["idempotency-key"];

        if (!merchantId || !idempotencyKey || !amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await createPayout({
            merchantId,
            amount,
            idempotencyKey,
        });

        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getPayoutsController(req, res, next) {
    try {
        const merchantId = "11111111-1111-1111-1111-111111111111";

        const payoutsList = await db
            .select()
            .from(payouts)
            .where(eq(payouts.merchantId, merchantId))
            .orderBy(sql`${payouts.createdAt} DESC`);

        const balanceResult = await db.execute(sql`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0) 
            AS balance 
            FROM ledger 
            WHERE merchant_id = ${merchantId}
        `);

        res.json({
            payouts: payoutsList,
            balance: Number(balanceResult.rows[0].balance),
        });
    } catch (err) {
        next(err);
    }
}