import fetch from "node-fetch";

const URL = "http://localhost:5000/api/v1/payouts";

async function test() {
  const key = "test-idem-123";

  const body = JSON.stringify({ amount: 1000 });

  const headers = {
    "Content-Type": "application/json",
    "x-merchant-id": "11111111-1111-1111-1111-111111111111",
    "idempotency-key": key,
  };

  const r1 = await fetch(URL, { method: "POST", headers, body });
  const r2 = await fetch(URL, { method: "POST", headers, body });

  const d1 = await r1.json();
  const d2 = await r2.json();

  console.log("First:", d1);
  console.log("Second:", d2);
}

test();