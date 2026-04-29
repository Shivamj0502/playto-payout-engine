1. The Ledger
I am storing all money movements as entries in a ledger table instead of storing balance directly.
Credits represent money coming in and debits represent payouts.
To calculate balance, I use this query:

SQL

SELECT 
  COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0) 
AS balance
FROM ledger
WHERE merchant_id = ?
I chose this design because:

It avoids inconsistency issues of storing balance separately

Every transaction is recorded, so it is easy to audit

Balance is always derived from source of truth

2. The Lock
To prevent two payouts from using the same balance, I use a database row-level lock:

TypeScript

await tx
  .select()
  .from(merchants)
  .where(eq(merchants.id, merchantId))
  .for("update");
This ensures that when one transaction is running for a merchant, another transaction has to wait.
So if two payout requests come at the same time:

First one locks the merchant row

Second one waits

After first finishes, second sees updated balance

This prevents double spending.

3. The Idempotency
I store idempotency keys in a table with a unique constraint on:

SQL

(merchant_id, key)
Flow:

When request comes, I first check if key already exists

If response is already stored → return same response

If request is in progress → return processing

If key does not exist → insert new row

If two requests come at same time:

One will insert successfully

Second will fail due to unique constraint

Then second fetches existing record

This guarantees no duplicate payouts.

4. The State Machine
Allowed transitions:

pending → processing → completed
pending → processing → failed
I enforce these transitions inside the worker using conditional database updates.

To move a payout from pending → processing, I use:

SQL

WHERE id = ? AND status = 'pending'
To move a payout from processing → completed or processing → failed, I use:

SQL

WHERE id = ? AND status = 'processing'
This ensures that a payout can only move forward in the lifecycle and cannot be processed multiple times.

Invalid transitions such as:

completed → pending
failed → completed
are automatically blocked because the WHERE condition will not match any rows, so no update is performed.

This approach leverages the database itself to enforce the state machine, making it safe under concurrent worker execution.

5. The AI Audit
What AI initially suggested (wrong approach)
AI gave a flow like:

Check balance

If enough → create payout

Deduct balance

This looks fine but is not safe.

The bug
Two requests can:

Both read same balance

Both pass check

Both create payout

This is a classic check-then-act race condition.

What I changed
I wrapped everything inside a database transaction + row lock:

TypeScript

.select()
.from(merchants)
.where(...)
.for("update")
Now flow becomes:

Lock merchant

Calculate balance

Create payout

Debit ledger

All inside single transaction.

Why this fix works
Only one request can run at a time per merchant

Second request waits

Second sees updated balance

Idempotency fix (another AI gap)
AI suggested:

Just check if key exists

That is unsafe. I replaced it with:

Unique constraint at DB level

Catch constraint violation

This guarantees correctness under race.