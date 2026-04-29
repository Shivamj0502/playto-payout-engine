import { db } from "../config/db.js";

export async function withTransaction(callback) {
  return await db.transaction(async (tx) => {
    try {
      return await callback(tx);
    } catch (err) {
      console.error("TX ERROR:", err);
      throw err;
    }
  });
}