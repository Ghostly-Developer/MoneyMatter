import React, { useRef } from 'react';
import { X, IndianRupee, Euro, DollarSign, Monitor, Sun, Moon, FolderOpen, Download, Check } from 'lucide-react';
import { getAccentTokens, ACCENT_OPTIONS, type AccentColor } from '../constants/accentColors';

export type BaseCurrency = 'INR' | 'EUR' | 'USD';
export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  accent?: AccentColor;
  baseCurrency?: BaseCurrency;
  onBaseCurrencyChange?: (currency: BaseCurrency) => void;
  themeMode?: ThemeMode;
  onThemeModeChange?: (mode: ThemeMode) => void;
  onAccentChange?: (accent: AccentColor) => void;
  dataDirectory?: string | null;
  onSelectDataDirectory?: (folderName: string) => void;
  onExportData?: () => void;
}

const CURRENCY_OPTIONS: Array<{ id: BaseCurrency; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'INR', label: 'Rupee', icon: IndianRupee },
  { id: 'EUR', label: 'Euro', icon: Euro },
  { id: 'USD', label: 'Dollar', icon: DollarSign },
];

const THEME_MODE_OPTIONS: Array<{ id: ThemeMode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

export function SettingsModal({
  open,
  onClose,
  theme = 'dark',
  accent = 'green',
  baseCurrency = 'INR',
  onBaseCurrencyChange = () => {},
  themeMode = 'system',
  onThemeModeChange = () => {},
  onAccentChange = () => {},
  dataDirectory = null,
  onSelectDataDirectory = () => {},
  onExportData = () => {},
}: SettingsModalProps) {
  if (!open) return null;

  const isDark = theme === 'dark';
  const t = getAccentTokens(theme, accent);
  const accentVars = {
    '--accent-solid': t.solid,
    '--accent-solid-hover': t.solidHover,
    '--accent-pastel-bg': t.pastelBg,
    '--accent-pastel-text': t.pastelText,
  } as React.CSSProperties;

  const labelClass = `block text-[10px] uppercase font-bold tracking-wider mb-2 ${isDark ? 'text-[#8e8ca0]' : 'text-[#767586]'}`;
  const pillActive = 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)] font-semibold';
  const pillInactive = isDark ? 'text-[#c7c4d7] hover:bg-[#2a2a2a]' : 'text-[#464554] hover:bg-white';

  const canPickDirectory = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  // webkitdirectory/directory aren't in React's InputHTMLAttributes typings.
  const folderInputProps = { webkitdirectory: 'true', directory: 'true' } as unknown as React.InputHTMLAttributes<HTMLInputElement>;

  const handlePickDirectory = async () => {
    if (!canPickDirectory) {
      folderInputRef.current?.click();
      return;
    }
    try {
      const picker = (window as unknown as { showDirectoryPicker: () => Promise<{ name: string }> }).showDirectoryPicker;
      const handle = await picker();
      onSelectDataDirectory(handle.name);
    } catch {
      // User cancelled the picker — nothing to do.
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      onSelectDataDirectory(relativePath ? relativePath.split('/')[0] : file.name);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={accentVars}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 ${
          isDark ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md transition-colors ${
              isDark
                ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Base Currency */}
          <div>
            <label className={labelClass}>Base Currency</label>
            <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-[#201f1f]' : 'bg-[#f8f9ff]'}`}>
              {CURRENCY_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onBaseCurrencyChange(id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] tracking-wide transition-colors ${
                    baseCurrency === id ? pillActive : pillInactive
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Default Theme */}
          <div>
            <label className={labelClass}>Default Theme</label>
            <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-[#201f1f]' : 'bg-[#f8f9ff]'}`}>
              {THEME_MODE_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onThemeModeChange(id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] tracking-wide transition-colors ${
                    themeMode === id ? pillActive : pillInactive
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label className={labelClass}>Theme Color</label>
            <div className="flex items-center gap-3">
              {ACCENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onAccentChange(option.id)}
                  title={option.label}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors"
                    style={{
                      backgroundColor: option.swatch,
                      borderColor: accent === option.id ? option.swatch : 'transparent',
                      boxShadow: accent === option.id ? `0 0 0 2px ${isDark ? '#1a1a1a' : '#ffffff'}, 0 0 0 4px ${option.swatch}` : undefined,
                    }}
                  >
                    {accent === option.id && <Check size={14} className="text-white" />}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Directory */}
          <div>
            <label className={labelClass}>Data Directory</label>
            <div
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 border ${
                isDark ? 'bg-[#201f1f] border-[#2d2c38]' : 'bg-[#f8f9ff] border-[#c7c4d7]'
              }`}
            >
              <FolderOpen size={16} className={isDark ? 'text-[#8e8ca0]' : 'text-[#767586]'} />
              <span className={`flex-1 text-[13px] truncate ${dataDirectory ? (isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]') : isDark ? 'text-[#6b697b]' : 'text-[#9a98a8]'}`}>
                {dataDirectory ?? 'No folder selected'}
              </span>
              <button
                onClick={handlePickDirectory}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold tracking-wide transition-colors ${
                  isDark ? 'bg-[#2a2a2a] text-[#e5e2e1] hover:bg-[#353534]' : 'bg-white border border-[#c7c4d7] text-[#0b1c30] hover:bg-[#eff4ff]'
                }`}
              >
                Browse
              </button>
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFolderInputChange}
                {...folderInputProps}
              />
            </div>
          </div>

          {/* Export Data */}
          <div>
            <label className={labelClass}>Export Data</label>
            <button
              onClick={onExportData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
