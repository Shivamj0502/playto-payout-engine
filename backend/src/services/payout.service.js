import { withTransaction } from "../utils/dbTransaction.js";
import { payouts } from "../models/payout.model.js";
import { ledger } from "../models/ledger.model.js";
import { merchants } from "../models/merchant.model.js";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import {
  getIdempotency,
  createIdempotency,
  saveResponse,
} from "./idempotency.service.js";

import { payoutQueue } from "../jobs/queue.js";

export async function createPayout({ merchantId, amount, idempotencyKey }) {
  return await withTransaction(async (tx) => {
    try {
      console.log("🟢 START TRANSACTION");

      // ========================
      // STEP 1: IDEMPOTENCY CHECK
      // ========================
      console.log("STEP 1: checking idempotency");
      const existing = await getIdempotency(tx, merchantId, idempotencyKey);

      if (existing) {
        console.log("⚠️ Idempotency hit");

        if (existing.response) {
          return JSON.parse(existing.response);
        }

        return { status: "processing" };
      }

      // ========================
      // STEP 2: CREATE IDEMPOTENCY KEY
      // ========================
      console.log("STEP 2: creating idempotency");
      try {
        await createIdempotency(tx, merchantId, idempotencyKey);
      } catch (err) {
        console.log("⚠️ Race condition on idempotency");

        const retry = await getIdempotency(tx, merchantId, idempotencyKey);
        if (retry?.response) {
          return JSON.parse(retry.response);
        }

        return { status: "processing" };
      }

      // ========================
      // STEP 3: LOCK MERCHANT
      // ========================
      console.log("STEP 3: locking merchant");

      const merchant = await tx
        .select()
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .for("update");

      if (merchant.length === 0) {
        throw new Error("Merchant not found ❌");
      }

      // ========================
      // STEP 4: BALANCE CALCULATION
      // ========================
      console.log("STEP 4: calculating balance");

      const balanceResult = await tx.execute(sql`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0)
        AS balance
        FROM ledger
        WHERE merchant_id = ${merchantId}
      `);

      const balance = BigInt(balanceResult.rows[0].balance);
      console.log("💰 Balance:", balance.toString());

      if (balance < BigInt(amount)) {
        throw new Error("Insufficient balance ❌");
      }

      // ========================
      // STEP 5: CREATE PAYOUT
      // ========================
      console.log("STEP 5: creating payout");

      const payoutId = uuidv4();

      await tx.insert(payouts).values({
        id: payoutId,
        merchantId,
        amount,
        status: "pending",
      });

      // ========================
      // STEP 6: HOLD FUNDS (DEBIT)
      // ========================
      console.log("STEP 6: debiting ledger");

      await tx.insert(ledger).values({
        merchantId,
        amount,
        type: "DEBIT",
        referenceId: payoutId,
      });

      const response = {
        payoutId,
        status: "pending",
      };

      // ========================
      // STEP 7: SAVE IDEMPOTENCY RESPONSE
      // ========================
      console.log("STEP 7: saving idempotency response");

      await saveResponse(tx, merchantId, idempotencyKey, response);

      // ========================
      // STEP 8: QUEUE JOB
      // ========================
      console.log("STEP 8: adding to queue");

      //await payoutQueue.add("process-payout", { payoutId });

      console.log("✅ TRANSACTION SUCCESS");

      return response;
    } catch (err) {
      console.error("💥 TRANSACTION FAILED:", err.message);
      throw err; // IMPORTANT: don't swallow error
    }
  });
}