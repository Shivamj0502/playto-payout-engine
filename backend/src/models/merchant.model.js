import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});