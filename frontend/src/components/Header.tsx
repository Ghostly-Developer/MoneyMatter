import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Check, CirclePlus, Bell, Moon, Sun } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  avatar: string;
}

interface HeaderProps {
  currentProfile?: Profile;
  profiles?: Profile[];
  onSelectProfile?: (profile: Profile) => void;
  onOpenSearch?: () => void;
  onOpenAddTransaction?: () => void;
  onOpenAlerts?: () => void;
  hasAlerts?: boolean;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  sidebarCollapsed?: boolean;
}

export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function Header({
  currentProfile = { id: '1', name: 'Primary', avatar: 'P' },
  profiles = [
    { id: '1', name: 'Primary Account', avatar: 'P' },
    { id: '2', name: 'Joint Account', avatar: 'J' },
  ],
  onSelectProfile = () => {},
  onOpenSearch = () => {},
  onOpenAddTransaction = () => {},
  onOpenAlerts = () => {},
  hasAlerts = false,
  theme,
  onThemeChange = () => {},
  sidebarCollapsed = false,
}: HeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => theme ?? getSystemTheme());

  // Keyboard shortcut listener for Command+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const handleThemeToggle = (newTheme: 'dark' | 'light') => {
    setCurrentTheme(newTheme);
    onThemeChange(newTheme);
    // Apply theme to document
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-200 ${
      sidebarCollapsed ? 'md:left-20' : 'md:left-64'
    } ${
      currentTheme === 'dark'
        ? 'bg-[#131313] border-b border-[#2d2c38]/40 bg-opacity-95'
        : 'bg-white border-b border-[#E2E8F0]'
    }`}>
      <div className="flex justify-between items-center w-full h-16 px-4 md:px-10">
        {/* Omni-Search Bar */}
        <div
          onClick={onOpenSearch}
          className={`hidden md:flex items-center transition-all rounded-full px-4 py-2 w-96 border cursor-pointer group shadow-inner ${
            currentTheme === 'dark'
              ? 'bg-[#201f1f] hover:bg-[#2a2a2a] border-[#2d2c38]'
              : 'bg-[#f8f9ff] hover:bg-white border-[#c7c4d7]'
          }`}
        >
          <Search
            size={20}
            className={`mr-2 transition-colors ${
              currentTheme === 'dark'
                ? 'text-[#c7c4d7] group-hover:text-white'
                : 'text-[#767586] group-hover:text-[#4648d4]'
            }`}
          />
          <span className={`text-[13px] w-full transition-colors select-none ${
            currentTheme === 'dark'
              ? 'text-[#8e8ca0] group-hover:text-[#c7c4d7]'
              : 'text-[#767586] group-hover:text-[#0b1c30]'
          }`}>
            Search commands, assets, or reports...
          </span>
          <span className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ml-2 tracking-widest font-mono ${
            currentTheme === 'dark'
              ? 'text-[#8e8ca0] bg-[#131313] border border-[#353534]'
              : 'text-[#767586] bg-[#eff4ff] border border-[#4648d4]'
          }`}>
            ⌘K
          </span>
        </div>

        {/* Right Section: Profile & Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Profile Switcher */}
          <div className="relative">
            <div
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`flex items-center gap-2.5 rounded-full px-3 py-1.5 cursor-pointer border transition-all select-none ${
                currentTheme === 'dark'
                  ? 'bg-[#2a2a2a] hover:bg-[#353534] border-[#3f3e4d]/40'
                  : 'bg-[#eff4ff] hover:bg-white border-[#c7c4d7]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                currentTheme === 'dark' ? 'bg-[#6366f1]' : 'bg-[#4648d4]'
              }`}>
                {currentProfile.avatar}
              </div>
              <span className={`text-[13px] font-medium max-w-[130px] truncate ${
                currentTheme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'
              }`}>
                {currentProfile.name}
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${
                  currentTheme === 'dark' ? 'text-[#c7c4d7]' : 'text-[#767586]'
                } ${profileDropdownOpen ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-2xl z-50 p-1.5 divide-y ${
                  currentTheme === 'dark'
                    ? 'bg-[#1a1a1a] border border-[#353534] divide-[#2d2c38]'
                    : 'bg-white border border-[#E2E8F0] divide-[#E2E8F0]'
                }`}>
                  {/* Financial Entities Section */}
                  <div className="px-3 py-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                      currentTheme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'
                    }`}>
                      Switch Financial Entity
                    </span>
                  </div>
                  <div className="py-1">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProfile(p);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors ${
                          p.id === currentProfile.id
                            ? currentTheme === 'dark'
                              ? 'bg-[#6366f1]/20 text-[#c0c1ff] font-semibold'
                              : 'bg-[#4648d4]/20 text-[#4648d4] font-semibold'
                            : currentTheme === 'dark'
                            ? 'text-[#e5e2e1] hover:bg-[#2a2a2a]'
                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                            currentTheme === 'dark'
                              ? 'bg-[#2a2a2a] border-[#464554]'
                              : 'bg-[#eff4ff] border-[#c7c4d7]'
                          }`}>
                            {p.avatar}
                          </span>
                          <span>{p.name}</span>
                        </div>
                        {p.id === currentProfile.id && (
                          <Check
                            size={16}
                            className={currentTheme === 'dark' ? 'text-[#6366f1]' : 'text-[#4648d4]'}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Header Action Icons */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onOpenAddTransaction}
              title="Add Transaction or Asset"
              className={`p-1.5 rounded-lg transition-all ${
                currentTheme === 'dark'
                  ? 'text-[#c7c4d7] hover:text-[#4edea3] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:text-[#4648d4] hover:bg-[#eff4ff]'
              }`}
            >
              <CirclePlus size={22} />
            </button>
            <button
              onClick={() => handleThemeToggle(currentTheme === 'dark' ? 'light' : 'dark')}
              title={currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className={`p-1.5 rounded-lg transition-all ${
                currentTheme === 'dark'
                  ? 'text-[#c7c4d7] hover:text-[#c0c1ff] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:text-[#4648d4] hover:bg-[#eff4ff]'
              }`}
            >
              {currentTheme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            <button
              onClick={onOpenAlerts}
              title="Alerts"
              className={`p-1.5 rounded-lg transition-all relative ${
                currentTheme === 'dark'
                  ? 'text-[#c7c4d7] hover:text-[#c0c1ff] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:text-[#4648d4] hover:bg-[#eff4ff]'
              }`}
            >
              <Bell size={22} />
              {hasAlerts && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ${
                  currentTheme === 'dark'
                    ? 'bg-[#ef4444] ring-[#131313]'
                    : 'bg-[#ef4444] ring-white'
                }`} />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}