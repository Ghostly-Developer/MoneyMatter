interface Transaction {
  date: string;
  entity: string;
  category: string;
  categoryTag: string;
  account: string;
  amount: number;
  isExpense: boolean;
}

const transactions: Transaction[] = [
  {
    date: '22 May 2024',
    entity: 'Amazon Web Services',
    category: 'CLOUD',
    categoryTag: 'CLOUD',
    account: 'Business Visa •• 4921',
    amount: -1492.0,
    isExpense: true,
  },
  {
    date: '21 May 2024',
    entity: 'Apple Inc. Dividend',
    category: 'DIVIDEND',
    categoryTag: 'DIVIDEND',
    account: 'Schwab Brokerage',
    amount: 140.2,
    isExpense: false,
  },
  {
    date: '20 May 2024',
    entity: 'Whole Foods Market',
    category: 'GROCERY',
    categoryTag: 'GROCERY',
    account: 'Personal Chase •• 1002',
    amount: -84.12,
    isExpense: true,
  },
];

export function TransactionTable() {
  return (
    <div className="bento-card md:col-span-12 p-[24px] rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          Recent Money Movements
        </span>
        <button className="text-primary text-label-sm font-bold hover:underline">View All Activity</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-label-sm text-on-surface-variant opacity-60 border-b border-outline-variant">
              <th className="pb-3 font-semibold">DATE</th>
              <th className="pb-3 font-semibold">ENTITY</th>
              <th className="pb-3 font-semibold">CATEGORY</th>
              <th className="pb-3 font-semibold">ACCOUNT</th>
              <th className="pb-3 font-semibold text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {transactions.map((tx, index) => (
              <tr key={index} className="hover:bg-surface-container-high transition-colors">
                <td className="py-4 font-data-tabular">{tx.date}</td>
                <td className="py-4 font-label-md">{tx.entity}</td>
                <td className="py-4">
                  <span className="px-2 py-1 rounded bg-surface-container-highest text-[10px] font-bold text-on-surface-variant">
                    {tx.categoryTag}
                  </span>
                </td>
                <td className="py-4 text-on-surface-variant">{tx.account}</td>
                <td
                  className={`py-4 font-data-tabular text-right ${
                    tx.isExpense ? 'text-tertiary-container' : 'text-secondary'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''} ${Math.abs(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
