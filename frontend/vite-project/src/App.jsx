import { useState, useEffect } from "react";
import PayoutForm from "./components/PayoutForm";
import PayoutList from "./components/PayoutList";
import { fetchPayouts } from "./api/payoutApi";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [balance, setBalance] = useState(0);

  const loadData = async () => {
    try {
      const res = await fetchPayouts();

      const sorted = (res.data.payouts || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setLogs(sorted);
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex justify-center pt-16 px-4">
      <div className="w-full max-w-lg space-y-6">

        <div className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Playto Pay</h1>
          </div>
          <div>
            <p className="text-xs">Balance</p>
            <h2 className="text-2xl font-bold">
              ₹{(balance / 100).toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl">
          <PayoutForm onNew={loadData} />
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-3">
          <PayoutList data={logs} />
        </div>

      </div>
    </div>
  );
}