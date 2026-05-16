export function Footer() {
  return (
    <>
      {/* Desktop Footer */}
      <footer className="w-full bg-surface dark:bg-surface border-t border-outline-variant md:ml-64 relative z-10">
        <div className="w-full flex flex-col md:flex-row justify-between items-center px-4 md:px-[40px] py-6 max-w-[1440px] mx-auto gap-4">
          <span className="font-label-sm text-label-sm font-bold text-on-surface dark:text-on-surface">
            © 2024 MoneyMatter. Data as Light.
          </span>
          <div className="flex gap-6">
            <a
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Security Standards
            </a>
            <a
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              API Support
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Bar (Suppress on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center py-3 z-50">
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">lock</span>
          <span className="text-[10px] font-bold">Vault</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">upload_file</span>
          <span className="text-[10px] font-bold">Data</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>
    </>
  );
}
