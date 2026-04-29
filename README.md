💳 Playto Payout Engine (Backend)

This project is a minimal payout engine built to simulate how real-world payment systems handle money movement, concurrency, and failure safely.

The goal was not to build “just APIs”, but to build something that does not lose money.

🧠 What this system does?
1. Merchants have a balance
2. Balance is not stored, it is derived from ledger entries
3. Merchants can:
    Request payouts
    See payout status
    View their balance
4. A background worker processes payouts asynchronously


🏗️ Tech Stack
1. Node.js + Express
2. PostgreSQL (Drizzle ORM)
3. Redis + BullMQ (queue + worker)
4. Docker (Postgres + Redis)


## 📂 Project Structure

```text
backend/
├── src/
│   ├── config/         # DB setup
│   ├── models/         # Tables (ledger, payouts, merchants, idempotency)
│   ├── services/       # Core business logic (VERY IMPORTANT)
│   ├── controllers/    # Request handlers
│   ├── routes/         # API routes
│   ├── workers/        # Background jobs
│   ├── jobs/           # Queue setup
│   ├── utils/          # Transaction wrapper
│   ├── middlewares/    # Error handling
│   ├── app.js
│   └── server.js
└── package.json


⚙️ Setup Instructions
1. Clone repo
git clone <your-repo>
cd backend

2. Start DB + Redis
docker-compose up -d

This will start:

Postgres → localhost:7001
Redis → localhost:7002

3. Setup environment

Create .env:

PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:7001/playto
REDIS_URL=redis://localhost:7002

4. Install dependencies
npm install

5. Run server
npm run dev

6. Run worker (IMPORTANT)

In another terminal:

node src/workers/payout.worker.js

Without worker, payouts will stay stuck in pending.

🧪 Seeding Data
You need to manually insert merchants and ledger credits.

Example:

INSERT INTO merchants (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Merchant');

INSERT INTO ledger (merchant_id, type, amount)
VALUES ('11111111-1111-1111-1111-111111111111', 'CREDIT', 10000);

🔌 API Endpoints
➤ Create Payout
POST /api/v1/payouts

Headers:

x-merchant-id: <merchant_id>
idempotency-key: <unique_key>

Body:

{
  "amount": 5000
}

Response:

{
  "payoutId": "...",
  "status": "pending"
}

➤ Get Payouts + Balance
GET /api/v1/payouts

Response:

{
  "payouts": [...],
  "balance": 5000
}


🔁 Payout Lifecycle
pending → processing → completed
                     → failed (refund)

Handled by worker.

⚠️ Critical Design Decisions

1. Balance is NEVER stored
Always computed from ledger
Prevents inconsistency bugs

2. Strong concurrency protection
Row-level DB locking (FOR UPDATE)
Prevents double spending

3. Idempotency is enforced at DB level
Unique constraint (merchant_id, idempotency_key)
Guarantees no duplicate payouts

4. Worker-based processing
API is fast
Processing happens asynchronously

🔥 Real-world problems solved
Double spending	--> DB row lock
Duplicate API calls -->	Idempotency keys
Race conditions	--> Transactions
Partial failure --> Atomic updates
Retry safety --> State machine


🧪 What you should test
1. Concurrency test

Send 2 requests simultaneously:

Balance = 100
Two payouts = 60 each

✅ Expected:

One succeeds
One fails

2. Idempotency test

Send same request twice with same key

✅ Expected:

Same response
No duplicate payout
🧩 Worker Behavior
Picks pending payouts
70% → success
30% → failure (refund)

Failure case:

Status → failed
Money returned via CREDIT entry


🚨 Important Notes
All amounts stored as integers
No floats used anywhere
All money operations inside transactions
Database is the source of truth

Note: Due to Redis free-tier instability on deployment, queue processing is temporarily bypassed to ensure reliable payout creation. Core concurrency, idempotency, and ledger logic remain intact.

## 📸 Proof of Working

### 1. Create Payout (POST)

- Endpoint: `/api/v1/payouts`
- Shows idempotency + transaction + ledger debit

![post1](https://github.com/user-attachments/assets/f4b334b0-3652-4752-9642-e147171d7986)

---

### 2. Fetch Payouts & Balance (GET)

- Endpoint: `/api/v1/payouts`
- Shows stored payouts and computed balance from ledger

![get](https://github.com/user-attachments/assets/e4fec934-8f9f-4db7-84d4-20a233b00021)
