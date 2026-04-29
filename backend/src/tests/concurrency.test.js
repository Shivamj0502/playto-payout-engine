import fetch from "node-fetch";

const URL = "http://localhost:5000/api/v1/payouts";

async function send(amount, key) {
  return fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-merchant-id": "11111111-1111-1111-1111-111111111111",
      "idempotency-key": key,
    },
    body: JSON.stringify({ amount }),
  }).then((r) => r.json());
}

async function test() {
  const r = await Promise.all([
    send(6000, "c1"),
    send(6000, "c2"),
  ]);

  console.log(r);
}

test();