import {
  pgTable,
  uuid,
  bigint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const ledger = pgTable("ledger", {
  id: uuid("id").primaryKey().defaultRandom(),

  merchantId: uuid("merchant_id").notNull(),

  type: text("type").notNull(), // CREDIT or DEBIT

  amount: bigint("amount", { mode: "number" }).notNull(),

  referenceId: uuid("reference_id"), // payout or payment id

  createdAt: timestamp("created_at").defaultNow().notNull(),
});