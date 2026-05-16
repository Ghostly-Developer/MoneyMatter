export function QuickInsightsCard() {
  return (
    <div className="bento-card md:col-span-4 p-[24px] rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          bolt
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          Quick Insights
        </span>
      </div>
      <div className="space-y-4">
        <div className="p-3 bg-surface-container rounded-lg border-l-4 border-tertiary-container">
          <div className="flex justify-between items-start mb-1">
            <span className="text-label-md font-bold text-on-surface">Urgent: Credit Limit</span>
            <span className="text-[10px] bg-tertiary-container/20 text-tertiary-container px-1.5 py-0.5 rounded font-bold">
              HIGH
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Your Amex Platinum is at 85% utilization. Consider paying early to avoid score impact.
          </p>
        </div>
        <div className="p-3 bg-surface-container rounded-lg border-l-4 border-primary">
          <div className="flex justify-between items-start mb-1">
            <span className="text-label-md font-bold text-on-surface">Upcoming Bill</span>
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">INFO</span>
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Electricity Bill ($245) due in 3 days. Autopay scheduled for May 24.
          </p>
        </div>
        <div className="p-3 bg-surface-container rounded-lg border-l-4 border-secondary">
          <div className="flex justify-between items-start mb-1">
            <span className="text-label-md font-bold text-on-surface">Dividend Alert</span>
            <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-bold">NEW</span>
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Received $140.20 from AAPL. Would you like to reinvest or move to Vault?
          </p>
        </div>
      </div>
    </div>
  );
}
