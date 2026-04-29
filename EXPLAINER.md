1. The Ledger

I am storing all money movements as entries in a ledger table instead of storing balance directly.
Credits represent money coming in and debits represent payouts.
To calculate balance, I use this query:

// SELECT 
  COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0) 
AS balance
FROM ledger
WHERE merchant_id = ?
//

I chose this design because:
it avoids inconsistency issues of storing balance separately
every transaction is recorded, so it is easy to audit
balance is always derived from source of truth


2. The Lock

To prevent two payouts from using the same balance, I use a database row-level lock:

// await tx
  .select()
  .from(merchants)
  .where(eq(merchants.id, merchantId))
  .for("update");
//

This ensures that when one transaction is running for a merchant, another transaction has to wait.
So if two payout requests come at the same time:

first one locks the merchant row
second one waits
after first finishes, second sees updated balance

This prevents double spending.


3. The Idempotency

I store idempotency keys in a table with a unique constraint on:
//
(merchant_id, key)
//
Flow:

when request comes, I first check if key already exists
if response is already stored → return same response
if request is in progress → return processing
if key does not exist → insert new row

If two requests come at same time:

one will insert successfully
second will fail due to unique constraint
then second fetches existing record

This guarantees no duplicate payouts.


4. The State Machine

Allowed transitions:
```
pending → processing → completed
pending → processing → failed
```

I enforce these transitions inside the worker using conditional database updates.
* To move a payout from **pending → processing**, I use:
```
WHERE id = ? AND status = 'pending'
```
* To move a payout from **processing → completed** or **processing → failed**, I use:
```
WHERE id = ? AND status = 'processing'
```
This ensures that a payout can only move forward in the lifecycle and cannot be processed multiple times.
Invalid transitions such as:
```
completed → pending
failed → completed
```

are automatically blocked because the `WHERE` condition will not match any rows, so no update is performed.

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

both read same balance
both pass check
both create payout

This is a classic check-then-act race condition

What I changed

I wrapped everything inside a database transaction + row lock:
//
.select()
.from(merchants)
.where(...)
.for("update")
//
Now flow becomes:

lock merchant
calculate balance
create payout
debit ledger

All inside single transaction

Why this fix works
only one request can run at a time per merchant
second request waits
second sees updated balance

-------
Idempotency fix (another AI gap)

AI suggested:

just check if key exists

That is unsafe.

I replaced it with:

unique constraint at DB level
catch constraint violation

This guarantees correctness under race.

IMPORTANT - Initially, queue enqueueing inside transaction caused failures due to Redis connection resets.
I fixed it by decoupling queue dependency so payout creation remains reliable even if Redis is down.