import { idempotency } from "../models/idempotency.model.js";
import { eq, and } from "drizzle-orm";

export async function getIdempotency(tx, merchantId, key) {
  const result = await tx
    .select()
    .from(idempotency)
    .where(
      and(
        eq(idempotency.merchantId, merchantId),
        eq(idempotency.idempotencyKey, key)
      )
    );

  return result[0];
}

export async function createIdempotency(tx, merchantId, key) {
  await tx.insert(idempotency).values({
    merchantId,
    idempotencyKey: key,
  });
}

export async function saveResponse(tx, merchantId, key, response) {
  await tx
    .update(idempotency)
    .set({
      response: JSON.stringify(response),
    })
    .where(
      and(
        eq(idempotency.merchantId, merchantId),
        eq(idempotency.idempotencyKey, key)
      )
    );
}