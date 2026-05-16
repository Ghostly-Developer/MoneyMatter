export function PerformanceCard() {
  return (
    <div className="bento-card md:col-span-4 p-[24px] rounded-xl flex items-center justify-between relative overflow-hidden group">
      <div className="relative z-10">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-2">
          Alpha Performance
        </span>
        <div className="text-headline-lg font-bold text-secondary">+18.4%</div>
        <p className="text-label-sm text-on-surface-variant">YTD Alpha vs S&P 500</p>
      </div>
      <div className="relative z-10">
        <span className="material-symbols-outlined text-[48px] text-secondary opacity-20 group-hover:opacity-100 transition-opacity">
          auto_graph
        </span>
      </div>
      {/* Subtle background visual */}
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-secondary opacity-5 blur-3xl"></div>
    </div>
  );
}
