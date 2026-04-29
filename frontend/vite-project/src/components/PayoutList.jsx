export default function PayoutList({ data }) {
  if (!data.length) return <p>No transactions yet.</p>;

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const id = item.payoutId || item.id;

        return (
          <div key={id} className="flex justify-between p-4 bg-slate-900 rounded">
            <div>
              <p>₹{(item.amount / 100).toFixed(2)}</p>
              <p>ID: {id.slice(0, 8)}</p>
            </div>

            <div className="text-right">
              <p>{item.status}</p>
              <p>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString()
                  : "just now"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}