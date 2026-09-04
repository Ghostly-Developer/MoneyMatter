import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, CirclePlus, Bell, Moon, Sun, Pencil, UserPlus, CheckCheck } from 'lucide-react';
import { getAccentTokens, type AccentColor } from '../constants/accentColors';
import { ProfileModal, type Profile } from './ProfileModal';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
}

// Read notifications are removed from state immediately (see `dismissNotification`) rather than
// flagged and filtered, so this list only ever holds unread ones.
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Payslip ingested', description: 'Your October payslip from Primary Employment was added automatically.', time: '2h ago' },
  { id: '2', title: 'Unusual expense detected', description: 'A transaction of ₹18,450 is 3x higher than your average for this category.', time: '5h ago' },
  { id: '3', title: 'Budget threshold reached', description: "You've used 90% of your Dining Out budget for this month.", time: '1d ago' },
];

interface HeaderProps {
  currentProfile?: Profile;
  profiles?: Profile[];
  onSelectProfile?: (profile: Profile) => void;
  onEditProfile?: (profile: Profile) => void;
  onAddProfile?: (profile: Profile) => void;
  onOpenSearch?: () => void;
  onOpenAddTransaction?: () => void;
  onOpenAlerts?: () => void;
  hasAlerts?: boolean;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  accent?: AccentColor;
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
  onEditProfile = () => {},
  onAddProfile = () => {},
  onOpenSearch = () => {},
  onOpenAddTransaction = () => {},
  onOpenAlerts = () => {},
  hasAlerts = false,
  theme,
  onThemeChange = () => {},
  accent = 'green',
  sidebarCollapsed = false,
}: HeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModal, setProfileModal] = useState<{ mode: 'add' | 'edit'; profile: Profile | null } | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const hasUnread = hasAlerts || notifications.length > 0;
  const dismissNotification = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => theme ?? getSystemTheme());
  const t = getAccentTokens(currentTheme, accent);
  const profileRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  // Keep in sync with the theme prop when it changes externally (e.g. from the Settings popup)
  useEffect(() => {
    if (theme && theme !== currentTheme) setCurrentTheme(theme);
  }, [theme]);

  // Close the profile/alerts dropdowns on an outside click. Listening on `document` (rather
  // than the old per-dropdown `fixed inset-0` overlay) is required because the header has
  // `backdrop-blur-md`, which makes it a containing block for `position: fixed` descendants —
  // a `fixed inset-0` overlay nested inside it only covers the header's own box, not the
  // viewport (same gotcha documented for ProfileModal in DECISIONS.md).
  useEffect(() => {
    if (!profileDropdownOpen && !alertsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (alertsOpen && alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen, alertsOpen]);

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
                ? 'text-[#c7c4d7]'
                : 'text-[#767586]'
            }`}
          />
          <span className={`text-[13px] w-full transition-colors select-none ${
            currentTheme === 'dark'
              ? 'text-[#8e8ca0]'
              : 'text-[#767586]'
          }`}>
            Search commands, assets, or reports...
          </span>
          <span
            className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ml-2 tracking-widest font-mono border ${
              currentTheme === 'dark'
                ? 'text-[#8e8ca0] bg-[#131313] border-[#353534]'
                : 'text-[#767586] bg-[#eff4ff]'
            }`}
            style={currentTheme === 'dark' ? undefined : { borderColor: t.solid }}
          >
            ⌘K
          </span>
        </div>

        {/* Right Section: Profile & Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Profile Switcher */}
          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`flex items-center gap-2.5 rounded-full px-3 py-1.5 cursor-pointer border transition-all select-none ${
                currentTheme === 'dark'
                  ? 'bg-[#2a2a2a] hover:bg-[#353534] border-[#3f3e4d]/40'
                  : 'bg-[#eff4ff] hover:bg-white border-[#c7c4d7]'
              }`}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: currentProfile.color ?? t.solid }}
              >
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
                      Switch Profile
                    </span>
                  </div>
                  <div className="py-1">
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          onSelectProfile(p);
                          setProfileDropdownOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onSelectProfile(p);
                            setProfileDropdownOpen(false);
                          }
                        }}
                        style={
                          p.id === currentProfile.id
                            ? { backgroundColor: `${t.solid}33`, color: currentTheme === 'dark' ? t.pastelText : t.solid }
                            : undefined
                        }
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13px] transition-colors cursor-pointer ${
                          p.id === currentProfile.id
                            ? 'font-semibold'
                            : currentTheme === 'dark'
                            ? 'text-[#e5e2e1] hover:bg-[#2a2a2a]'
                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                              p.color
                                ? 'text-white border-transparent'
                                : currentTheme === 'dark'
                                ? 'bg-[#2a2a2a] border-[#464554]'
                                : 'bg-[#eff4ff] border-[#c7c4d7]'
                            }`}
                            style={p.color ? { backgroundColor: p.color } : undefined}
                          >
                            {p.avatar}
                          </span>
                          <span>{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileDropdownOpen(false);
                              setProfileModal({ mode: 'edit', profile: p });
                            }}
                            title={`Edit ${p.name}`}
                            className={`p-1 rounded-md transition-colors ${
                              currentTheme === 'dark'
                                ? 'text-[#8e8ca0] hover:bg-[#353534] hover:text-[#e5e2e1]'
                                : 'text-[#767586] hover:bg-white hover:text-[#0b1c30]'
                            }`}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModal({ mode: 'add', profile: null });
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-[13px] font-medium transition-colors ${
                        currentTheme === 'dark'
                          ? 'text-[#c7c4d7] hover:bg-[#2a2a2a]'
                          : 'text-[#464554] hover:bg-[#eff4ff]'
                      }`}
                    >
                      <UserPlus size={16} />
                      Add Profile
                    </button>
                  </div>
                </div>
            )}
          </div>

          <ProfileModal
            open={profileModal !== null}
            mode={profileModal?.mode ?? 'add'}
            profile={profileModal?.profile ?? null}
            theme={currentTheme}
            accent={accent}
            onClose={() => setProfileModal(null)}
            onSave={(p) => {
              if (profileModal?.mode === 'edit') {
                onEditProfile(p);
              } else {
                onAddProfile(p);
              }
              setProfileModal(null);
            }}
          />

          {/* Quick Header Action Icons */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onOpenAddTransaction}
              title="Add Transaction or Asset"
              className={`p-1.5 rounded-lg transition-all ${
                currentTheme === 'dark'
                  ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:bg-[#eff4ff]'
              }`}
            >
              <CirclePlus size={22} />
            </button>
            <button
              onClick={() => handleThemeToggle(currentTheme === 'dark' ? 'light' : 'dark')}
              title={currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className={`p-1.5 rounded-lg transition-all ${
                currentTheme === 'dark'
                  ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:bg-[#eff4ff]'
              }`}
            >
              {currentTheme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => {
                  setAlertsOpen((v) => !v);
                  onOpenAlerts();
                }}
                title="Alerts"
                className={`p-1.5 rounded-lg transition-all relative ${
                  currentTheme === 'dark'
                    ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
                    : 'text-[#767586] hover:bg-[#eff4ff]'
                }`}
              >
                <Bell size={22} />
                {hasUnread && (
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ${
                    currentTheme === 'dark'
                      ? 'bg-[#ef4444] ring-[#131313]'
                      : 'bg-[#ef4444] ring-white'
                  }`} />
                )}
              </button>

              {/* Alerts Dropdown */}
              {alertsOpen && (
                  <div className={`absolute right-0 mt-2 w-[480px] rounded-xl shadow-2xl z-50 flex flex-col ${
                    currentTheme === 'dark'
                      ? 'bg-[#1a1a1a] border border-[#353534]'
                      : 'bg-white border border-[#E2E8F0]'
                  }`}>
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${
                      currentTheme === 'dark' ? 'border-[#2d2c38]' : 'border-[#E2E8F0]'
                    }`}>
                      <span className={`text-[13px] font-semibold ${
                        currentTheme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'
                      }`}>
                        Notifications
                      </span>
                      <button
                        onClick={() => setNotifications([])}
                        title="Mark all as read"
                        className={`flex items-center gap-1 text-[11px] font-medium rounded-md px-1.5 py-1 transition-colors ${
                          currentTheme === 'dark'
                            ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                            : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                        }`}
                      >
                        <CheckCheck size={14} />
                        Mark all read
                      </button>
                    </div>

                    <div className={`max-h-80 overflow-y-auto divide-y ${
                      currentTheme === 'dark' ? 'divide-[#2d2c38]' : 'divide-[#E2E8F0]'
                    }`}>
                      {notifications.length === 0 ? (
                        <div className={`px-4 py-8 text-center text-[13px] ${
                          currentTheme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'
                        }`}>
                          You're all caught up.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => dismissNotification(n.id)}
                            className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer transition-colors ${
                              currentTheme === 'dark' ? 'hover:bg-[#201f1f]' : 'hover:bg-[#f8f9ff]'
                            }`}
                          >
                            <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-[#ef4444]" />
                            <div className="min-w-0">
                              <p className={`text-[13px] font-medium truncate ${
                                currentTheme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'
                              }`}>
                                {n.title}
                              </p>
                              <p className={`text-[12px] mt-0.5 line-clamp-2 ${
                                currentTheme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'
                              }`}>
                                {n.description}
                              </p>
                              <p className={`text-[11px] mt-1 ${
                                currentTheme === 'dark' ? 'text-[#5c5a6b]' : 'text-[#9a98a8]'
                              }`}>
                                {n.time}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}