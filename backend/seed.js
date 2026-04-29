import { db } from "./src/config/db.js";
import { merchants } from "./src/models/merchant.model.js";
import { ledger } from "./src/models/ledger.model.js";

async function seed() {
  const merchantId = "11111111-1111-1111-1111-111111111111";

  await db.insert(merchants).values({
    id: merchantId,
    name: "Test Merchant",
  });

  await db.insert(ledger).values({
    merchantId,
    type: "CREDIT",
    amount: 10000,
  });

  console.log("✅ Seed done");
  process.exit(0);
}

seed();