import TransparentLogo from "../assets/images/TransparentLogo.png";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface dark:bg-surface border-b border-outline-variant md:border-none">
      <div className="flex justify-between items-center w-full px-4 md:px-[40px] py-4 max-w-[1440px] mx-auto">
        
        <div className="flex items-center gap-4">
          <img src={TransparentLogo} alt="MoneyMatter Logo" className="w-8 h-8" />
          <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary">
            MoneyMatter
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Omni-Search */}
          <div className="hidden md:flex items-center bg-surface-container rounded-full px-4 py-2 w-96 border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-label-md w-full placeholder-on-surface-variant"
              placeholder="Search commands, assets, or reports..."
              type="text"
            />
            <span className="text-label-sm text-outline-variant border border-outline-variant rounded px-1 ml-2">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-surface-container-high rounded-full px-3 py-1.5 cursor-pointer hover:bg-surface-variant transition-colors">
            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary">
              JD
            </div>
            <span className="font-label-md text-label-md">Personal Profile</span>
            <span className="material-symbols-outlined text-label-md">expand_more</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              add_circle
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              settings
            </button>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              account_circle
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}