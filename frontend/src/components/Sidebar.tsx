import React from 'react';
import { LayoutDashboard, Lock, Wallet, Settings, LifeBuoy, Heart, PanelLeftClose, PanelLeftOpen, User, Banknote, TrendingUp, Receipt, Landmark } from 'lucide-react';
import { getAccentTokens, type AccentColor } from '../constants/accentColors';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSettings?: () => void;
  onOpenSupport?: () => void;
  theme?: 'dark' | 'light';
  accent?: AccentColor;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentTab = 'dashboard',
  onSelectTab = () => {},
  onOpenSettings = () => {},
  onOpenSupport = () => {},
  theme = 'dark',
  accent = 'green',
  collapsed = false,
  onToggleCollapse = () => {},
}: SidebarProps) {
  const t = getAccentTokens(theme, accent);
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'account', label: 'Account', icon: User },
    { id: 'income', label: 'Income', icon: Banknote },
    { id: 'investment', label: 'Investment', icon: TrendingUp },
    { id: 'expense', label: 'Expense', icon: Receipt },
    { id: 'mapper', label: 'Mapper', icon: Wallet },
    { id: 'vault', label: 'Vault', icon: Lock },
    { id: 'taxes', label: 'Taxes', icon: Landmark },
  ];

  return (
    <aside className={`hidden md:flex fixed left-0 top-0 h-screen flex-col z-40 justify-between transition-all duration-200 ${
      collapsed ? 'w-20' : 'w-64'
    } ${
      theme === 'dark'
        ? 'bg-[#0e0e0e] border-r border-[#1F1F1F]'
        : 'bg-white border-r border-[#E2E8F0]'
    }`}>
      {/* Brand Header - matches Header's height so it reads as one top bar */}
      <div>
        <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div
              className="w-10 h-10 shrink-0 rounded-lg text-white flex items-center justify-center font-black text-lg shadow-lg transition-transform group-hover:scale-105"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${t.gradientFrom}, ${t.gradientTo})`,
                boxShadow: `0 10px 15px -3px ${t.solid}40, 0 4px 6px -4px ${t.solid}40`,
              }}
            >
              M
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className={`text-[16px] font-black tracking-tight leading-tight ${
                  theme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'
                }`}>
                  Money<span style={{ color: t.solid }}>Matter</span>
                </h1>
                <p className={`text-[9px] tracking-widest uppercase font-semibold ${
                  theme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'
                }`}>
                  Finance Hub
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                theme === 'dark'
                  ? 'text-[#8e8ca0] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:bg-[#eff4ff]'
              }`}
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center pb-2">
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-[#8e8ca0] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:bg-[#eff4ff]'
              }`}
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="space-y-1.5 p-3">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                style={isActive ? { backgroundColor: t.pastelBg, color: t.pastelText } : undefined}
                className={`w-full flex items-center gap-3.5 py-3 rounded-lg text-left transition-all duration-150 ${
                  collapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'font-semibold'
                    : theme === 'dark'
                    ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
                    : 'text-[#464554] hover:bg-[#eff4ff]'
                }`}
              >
                <item.icon
                  size={20}
                  style={isActive ? { color: t.pastelText } : undefined}
                  className={`shrink-0 ${
                    isActive
                      ? ''
                      : theme === 'dark'
                      ? 'text-[#c7c4d7]'
                      : 'text-[#464554]'
                  }`}
                />
                {!collapsed && <span className="text-[13px] tracking-wide">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Auxiliary Links */}
      <div className="px-3 pt-4 space-y-1.5 pb-3">
        <button
          onClick={onOpenSettings}
          title={collapsed ? 'Settings' : undefined}
          className={`w-full flex items-center gap-3.5 py-2.5 rounded-lg transition-colors text-left ${
            collapsed ? 'justify-center px-0' : 'px-4'
          } ${
            theme === 'dark'
              ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
              : 'text-[#464554] hover:bg-[#eff4ff]'
          }`}
        >
          <Settings
            size={20}
            className={`shrink-0 ${theme === 'dark' ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}
          />
          {!collapsed && <span className="text-[13px] tracking-wide">Settings</span>}
        </button>
        <button
          onClick={onOpenSupport}
          title={collapsed ? 'Support' : undefined}
          className={`w-full flex items-center gap-3.5 py-2.5 rounded-lg transition-colors text-left ${
            collapsed ? 'justify-center px-0' : 'px-4'
          } ${
            theme === 'dark'
              ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
              : 'text-[#464554] hover:bg-[#eff4ff]'
          }`}
        >
          <LifeBuoy
            size={20}
            className={`shrink-0 ${theme === 'dark' ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}
          />
          {!collapsed && <span className="text-[13px] tracking-wide">Support</span>}
        </button>

        {/* Privacy Note */}
        {collapsed ? (
          <div className="flex justify-center pt-2" title="100% Private & Offline">
            <Heart size={13} className="fill-[#ef4444] text-[#ef4444] shrink-0" />
          </div>
        ) : (
          <p className={`px-4 pt-2 text-[11px] flex items-center justify-between whitespace-nowrap ${
            theme === 'dark' ? 'text-[#6b697b]' : 'text-[#767586]'
          }`}>
            100% Private &amp; Offline
            <Heart size={11} className="fill-[#ef4444] text-[#ef4444] shrink-0" />
          </p>
        )}
      </div>
    </aside>
  );
}
