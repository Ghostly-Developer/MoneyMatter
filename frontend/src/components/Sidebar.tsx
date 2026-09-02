import React from 'react';
import { LayoutDashboard, Lock, FileUp, Wallet, Settings, LifeBuoy, Heart, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSettings?: () => void;
  onOpenSupport?: () => void;
  theme?: 'dark' | 'light';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentTab = 'dashboard',
  onSelectTab = () => {},
  onOpenSettings = () => {},
  onOpenSupport = () => {},
  theme = 'dark',
  collapsed = false,
  onToggleCollapse = () => {},
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Vault', icon: Lock },
    { id: 'ingestion', label: 'Ingestion', icon: FileUp },
    { id: 'mapper', label: 'Mapper', icon: Wallet },
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
            <div className={`w-10 h-10 shrink-0 rounded-lg text-white flex items-center justify-center font-black text-lg shadow-lg transition-transform group-hover:scale-105 ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shadow-[#6366f1]/30'
                : 'bg-gradient-to-br from-[#4648d4] to-[#6366f1] shadow-[#4648d4]/20'
            }`}>
              M
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className={`text-[16px] font-black tracking-tight leading-tight ${
                  theme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'
                }`}>
                  Money<span className={theme === 'dark' ? 'text-[#6366f1]' : 'text-[#4648d4]'}>Matter</span>
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
                  ? 'text-[#8e8ca0] hover:text-[#e5e2e1] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
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
                  ? 'text-[#8e8ca0] hover:text-[#e5e2e1] hover:bg-[#201f1f]'
                  : 'text-[#767586] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
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
                className={`w-full flex items-center gap-3.5 py-3 rounded-lg text-left transition-all duration-150 ${
                  collapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white font-semibold shadow-lg shadow-[#6366f1]/20'
                      : 'bg-gradient-to-r from-[#4648d4] to-[#6366f1] text-white font-semibold shadow-lg shadow-[#4648d4]/20'
                    : theme === 'dark'
                    ? 'text-[#c7c4d7] hover:bg-[#201f1f] hover:text-[#e5e2e1]'
                    : 'text-[#464554] hover:bg-[#eff4ff] hover:text-[#4648d4]'
                }`}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 ${
                    isActive
                      ? 'text-white'
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
              ? 'text-[#c7c4d7] hover:bg-[#201f1f] hover:text-[#e5e2e1]'
              : 'text-[#464554] hover:bg-[#eff4ff] hover:text-[#4648d4]'
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
              ? 'text-[#c7c4d7] hover:bg-[#201f1f] hover:text-[#e5e2e1]'
              : 'text-[#464554] hover:bg-[#eff4ff] hover:text-[#4648d4]'
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
