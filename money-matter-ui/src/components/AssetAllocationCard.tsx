export function AssetAllocationCard() {
  return (
    <div className="bento-card md:col-span-4 md:row-span-2 p-[24px] rounded-xl flex flex-col">
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-6">
        Multi-Asset Allocation
      </span>
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="relative w-48 h-48">
          {/* Circular Progress/Donut */}
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" fill="transparent" r="80" stroke="#1F1F1F" strokeWidth="24"></circle>
            <circle
              cx="96"
              cy="96"
              fill="transparent"
              r="80"
              stroke="#6366F1"
              strokeDasharray="502"
              strokeDashoffset="150"
              strokeWidth="24"
            ></circle>
            <circle
              cx="96"
              cy="96"
              fill="transparent"
              r="80"
              stroke="#4edea3"
              strokeDasharray="502"
              strokeDashoffset="400"
              strokeWidth="24"
            ></circle>
            <circle
              cx="96"
              cy="96"
              fill="transparent"
              r="80"
              stroke="#ffb3ad"
              strokeDasharray="502"
              strokeDashoffset="450"
              strokeWidth="24"
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-on-surface-variant text-label-sm">Total Assets</span>
            <span className="font-headline-md text-headline-md">$1.8M</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary-container"></div>
            <span className="text-label-md">Equities</span>
          </div>
          <div className="font-data-tabular text-label-md">45%</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-label-md">Mutual Funds</span>
          </div>
          <div className="font-data-tabular text-label-md">30%</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-tertiary"></div>
            <span className="text-label-md">Retirement (EPF/PPF)</span>
          </div>
          <div className="font-data-tabular text-label-md">15%</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
            <span className="text-label-md">Fixed Deposits</span>
          </div>
          <div className="font-data-tabular text-label-md">10%</div>
        </div>
      </div>
      <button className="w-full mt-8 py-3 bg-surface-container-high rounded-lg text-label-md font-bold hover:bg-surface-variant border border-outline-variant transition-colors">
        Rebalance Portfolio
      </button>
    </div>
  );
}
