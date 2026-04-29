import { useState } from "react";
import { createPayout } from "../api/payoutApi";

export default function PayoutForm({ onNew }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0 || loading) return;

    try {
      setLoading(true);
      await createPayout(Number(amount));
      await onNew();
      setAmount("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-slate-500">
        Amount (₹, converted to paise internally)
      </p>

      <input
        type="number"
        placeholder="enter amount in ₹"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-lg outline-none"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-white text-black py-3 rounded-lg"
      >
        {loading ? "processing..." : "send payout"}
      </button>
    </div>
  );
}