import "dotenv/config";

export default {
  schema: "./src/models",
  out: "./drizzle",
  dialect: "postgresql",   // ✅ THIS WAS MISSING
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};