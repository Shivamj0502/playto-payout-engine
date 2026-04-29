import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

(async () => {
  try {
    const res = await db.execute(
      sql`SELECT current_database(), current_schema()`
    );
    console.log("🔥 CONNECTED DB:", res.rows);
  } catch (err) {
    console.error("DB ERROR:", err);
  }
})();