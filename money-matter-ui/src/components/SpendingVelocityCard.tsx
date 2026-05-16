export function SpendingVelocityCard() {
  return (
    <div className="bento-card md:col-span-8 md:row-span-2 p-[24px] rounded-xl flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Spending Velocity
          </span>
          <h3 className="font-headline-md text-headline-md mt-1">Monthly Cash Outflow</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-container"></span>
            <span className="text-label-sm text-on-surface-variant">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-outline-variant"></span>
            <span className="text-label-sm text-on-surface-variant">Previous</span>
          </div>
        </div>
      </div>
      <div className="flex-1 relative mt-4">
        {/* Simulated Line Graph */}
        <div className="absolute inset-0 flex items-end justify-between border-b border-outline-variant pb-2">
          <span className="text-[10px] text-outline-variant">01</span>
          <span className="text-[10px] text-outline-variant">07</span>
          <span className="text-[10px] text-outline-variant">14</span>
          <span className="text-[10px] text-outline-variant">21</span>
          <span className="text-[10px] text-outline-variant">28</span>
        </div>
        <svg className="w-full h-full pb-8" preserveAspectRatio="none" viewBox="0 0 100 40">
          {/* Previous Month (Grey) */}
          <path
            d="M0 35 L 10 32 L 20 36 L 30 25 L 40 28 L 50 20 L 60 22 L 70 15 L 80 18 L 90 10 L 100 5"
            fill="none"
            stroke="#464554"
            strokeDasharray="2"
            strokeWidth="0.5"
          ></path>
          {/* Current Month (Indigo) */}
          <path
            d="M0 38 L 10 30 L 20 28 L 30 32 L 40 20 L 50 15 L 60 18 L 70 10 L 80 5"
            fill="none"
            stroke="#6366F1"
            strokeWidth="1.5"
          ></path>
          {/* Glow dots */}
          <circle cx="80" cy="5" fill="#6366F1" r="1.5"></circle>
        </svg>
        {/* Value labels */}
        <div className="absolute right-0 top-0 bg-surface-container p-3 rounded-lg border border-outline-variant shadow-lg translate-y-4">
          <div className="text-label-sm text-on-surface-variant mb-1">May 21st</div>
          <div className="font-data-tabular text-headline-md text-primary">$12,450.00</div>
          <div className="text-[10px] text-secondary">+12% vs avg.</div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-surface-container rounded-lg border border-outline-variant">
          <div className="text-on-surface-variant text-[10px] uppercase font-bold mb-1">Fixed Bills</div>
          <div className="font-data-tabular text-body-lg">$2,400</div>
        </div>
        <div className="p-3 bg-surface-container rounded-lg border border-outline-variant">
          <div className="text-on-surface-variant text-[10px] uppercase font-bold mb-1">Discretionary</div>
          <div className="font-data-tabular text-body-lg">$4,821</div>
        </div>
        <div className="p-3 bg-surface-container rounded-lg border border-outline-variant">
          <div className="text-on-surface-variant text-[10px] uppercase font-bold mb-1">Investment</div>
          <div className="font-data-tabular text-body-lg">$5,000</div>
        </div>
        <div className="p-3 bg-surface-container rounded-lg border border-outline-variant">
          <div className="text-on-surface-variant text-[10px] uppercase font-bold mb-1">Burn Rate</div>
          <div className="font-data-tabular text-body-lg">$401/day</div>
        </div>
      </div>
    </div>
  );
}
