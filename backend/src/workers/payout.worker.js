import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import { db } from "../config/db.js";
import { payouts } from "../models/payout.model.js";
import { ledger } from "../models/ledger.model.js";
import { eq, sql } from "drizzle-orm";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL);

const worker = new Worker(
  "payout-queue",
  async (job) => {
    const { payoutId } = job.data;

    try {
      console.log("👨‍🍳 Processing payout:", payoutId);

      // 🔒 STEP 1: CLAIM (pending → processing)
      const claim = await db
        .update(payouts)
        .set({ status: "processing" })
        .where(
          sql`${payouts.id} = ${payoutId} AND ${payouts.status} = 'pending'`
        )
        .returning();

      // already picked by another worker
      if (claim.length === 0) {
        console.log("⚠️ Already processed or claimed:", payoutId);
        return;
      }

      const payout = claim[0];

      const rand = Math.random();

      // ✅ STEP 2: SUCCESS (processing → completed)
      if (rand < 0.7) {
        const update = await db
          .update(payouts)
          .set({ status: "completed" })
          .where(
            sql`${payouts.id} = ${payoutId} AND ${payouts.status} = 'processing'`
          )
          .returning();

        if (update.length === 0) return;

        console.log("✅ Success:", payoutId);
        return;
      }

      // ❌ STEP 3: FAIL (processing → failed + refund)
      await db.transaction(async (tx) => {
        const update = await tx
          .update(payouts)
          .set({ status: "failed" })
          .where(
            sql`${payouts.id} = ${payoutId} AND ${payouts.status} = 'processing'`
          )
          .returning();

        if (update.length === 0) return;

        await tx.insert(ledger).values({
          merchantId: payout.merchantId,
          amount: payout.amount,
          type: "CREDIT",
          referenceId: payoutId,
        });
      });

      console.log("❌ Failed + refunded:", payoutId);

    } catch (err) {
      console.error("💥 Worker error for:", payoutId, err.message);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

export default worker;