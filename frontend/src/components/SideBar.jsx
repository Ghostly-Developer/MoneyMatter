export function Sidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen flex-col p-[8px] w-64 bg-surface-container-lowest dark:bg-surface-container-lowest border-r border-outline-variant z-40 pt-24">
      <nav className="flex-1 space-y-2">
        <a
          className="flex items-center gap-3 bg-secondary-container dark:bg-secondary-container text-on-secondary-container dark:text-on-secondary-container rounded-lg px-4 py-3 translate-x-1 transition-transform"
          href="#"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-sm text-label-sm">Dashboard</span>
        </a>
        <a
          className="flex items-center gap-3 text-on-surface-variant dark:text-on-surface-variant px-4 py-3 hover:bg-surface-container-high rounded-lg transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">lock</span>
          <span className="font-label-sm text-label-sm">Vault</span>
        </a>
        <a
          className="flex items-center gap-3 text-on-surface-variant dark:text-on-surface-variant px-4 py-3 hover:bg-surface-container-high rounded-lg transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">upload_file</span>
          <span className="font-label-sm text-label-sm">Ingestion</span>
        </a>
        <a
          className="flex items-center gap-3 text-on-surface-variant dark:text-on-surface-variant px-4 py-3 hover:bg-surface-container-high rounded-lg transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="font-label-sm text-label-sm">Mapper</span>
        </a>
      </nav>
      <div className="pt-4 border-t border-outline-variant space-y-2">
        <a
          className="flex items-center gap-3 text-on-surface-variant dark:text-on-surface-variant px-4 py-3 hover:bg-surface-container-high rounded-lg transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm text-label-sm">Settings</span>
        </a>
        <a
          className="flex items-center gap-3 text-on-surface-variant dark:text-on-surface-variant px-4 py-3 hover:bg-surface-container-high rounded-lg transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">help</span>
          <span className="font-label-sm text-label-sm">Support</span>
        </a>
      </div>
    </aside>
  );
}