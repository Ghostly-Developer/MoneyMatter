export function PageHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Financial Command Center</h1>
        <p className="text-on-surface-variant font-body-md">Wealth summary for John Doe • Last updated 2 mins ago</p>
      </div>
      <div className="flex gap-3">
        <button className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-label-md flex items-center gap-2 border border-outline-variant hover:bg-surface-variant transition-all">
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          Last 30 Days
        </button>
        <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report
        </button>
      </div>
    </div>
  );
}
