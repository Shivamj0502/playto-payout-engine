import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const idempotency = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    merchantId: uuid("merchant_id").notNull(),

    idempotencyKey: text("idempotency_key").notNull(),

    response: text("response"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      uniqueKey: uniqueIndex("merchant_key_unique").on(
        table.merchantId,
        table.idempotencyKey
      ),
    };
  }
);