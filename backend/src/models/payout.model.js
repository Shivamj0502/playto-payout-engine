import {
  pgTable,
  uuid,
  bigint,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),

  merchantId: uuid("merchant_id").notNull(),

  amount: bigint("amount", { mode: "number" }).notNull(),

  status: text("status").notNull(), // pending, processing, completed, failed

  attemptCount: integer("attempt_count").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});