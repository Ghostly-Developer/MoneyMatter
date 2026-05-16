export function NetWorthCard() {
  return (
    <div className="bento-card md:col-span-4 p-[24px] flex flex-col justify-between rounded-xl">
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Net Worth Snapshot
          </span>
          <span className="material-symbols-outlined text-secondary">trending_up</span>
        </div>
        <div className="font-display-lg text-display-lg font-bold mb-2">$1,284,592.40</div>
        <div className="flex items-center gap-2 text-secondary font-label-md">
          <span className="material-symbols-outlined text-[16px]">north_east</span>
          +4.2% from last month
        </div>
      </div>
      <div className="mt-8 h-16 w-full">
        {/* Sparkline Visualization */}
        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
          <path
            className="sparkline-emerald"
            d="M0 50 Q 25 45, 50 48 T 100 35 T 150 40 T 200 10"
            fill="none"
            stroke="#10B981"
            strokeLinecap="round"
            strokeWidth="3"
          ></path>
          <path
            d="M0 50 Q 25 45, 50 48 T 100 35 T 150 40 T 200 10 V 60 H 0 Z"
            fill="url(#emeraldGradient)"
            opacity="0.1"
          ></path>
          <defs>
            <linearGradient id="emeraldGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10B981"></stop>
              <stop offset="100%" stopColor="#10B981" stopOpacity="0"></stop>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-outline-variant">
        <div className="text-center">
          <div className="text-on-surface-variant text-[10px] uppercase font-bold">Personal</div>
          <div className="font-data-tabular text-[14px]">$420K</div>
        </div>
        <div className="text-center border-x border-outline-variant">
          <div className="text-on-surface-variant text-[10px] uppercase font-bold">Business</div>
          <div className="font-data-tabular text-[14px]">$712K</div>
        </div>
        <div className="text-center">
          <div className="text-on-surface-variant text-[10px] uppercase font-bold">Joint</div>
          <div className="font-data-tabular text-[14px]">$152K</div>
        </div>
      </div>
    </div>
  );
}
