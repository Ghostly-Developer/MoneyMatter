import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { getAccentTokens, type AccentColor } from '../constants/accentColors';
import { AVATAR_COLOR_OPTIONS } from '../constants/avatarColors';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  color?: string;
}

interface ProfileModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  profile?: Profile | null;
  theme?: 'dark' | 'light';
  accent?: AccentColor;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (profile: Profile) => void;
}

export function ProfileModal({
  open,
  mode,
  profile = null,
  theme = 'dark',
  accent = 'green',
  saving = false,
  error = null,
  onClose,
  onSave,
}: ProfileModalProps) {
  const isDark = theme === 'dark';
  const t = getAccentTokens(theme, accent);
  const accentVars = {
    '--accent-solid': t.solid,
    '--accent-solid-hover': t.solidHover,
  } as React.CSSProperties;

  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLOR_OPTIONS[0]);

  useEffect(() => {
    if (!open) return;
    setName(profile?.name ?? '');
    setColor(profile?.color ?? AVATAR_COLOR_OPTIONS[0]);
  }, [open, profile]);

  if (!open) return null;

  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const labelClass = `block text-[10px] uppercase font-bold tracking-wider mb-2 ${isDark ? 'text-[#8e8ca0]' : 'text-[#767586]'}`;
  const inputClass = `w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors focus:border-[var(--accent-solid)] ${
    isDark ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1]' : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30]'
  }`;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      id: profile?.id ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `profile-${Date.now()}`),
      name: trimmed,
      avatar: initial,
      color,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={accentVars}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 ${
          isDark ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
            {mode === 'add' ? 'Add Profile' : 'Edit Profile'}
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

        <div className="space-y-5">
          <div className="flex justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
          </div>

          <div>
            <label className={labelClass}>Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Primary Account"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Logo Color</label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_COLOR_OPTIONS.map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => setColor(swatch)}
                  title={swatch}
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors"
                  style={{
                    backgroundColor: swatch,
                    borderColor: color === swatch ? swatch : 'transparent',
                    boxShadow: color === swatch ? `0 0 0 2px ${isDark ? '#1a1a1a' : '#ffffff'}, 0 0 0 4px ${swatch}` : undefined,
                  }}
                >
                  {color === swatch && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className={`text-[12px] ${isDark ? 'text-[#f87171]' : 'text-[#dc2626]'}`}>{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-7">
          <button
            onClick={onClose}
            disabled={saving}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-[#eff4ff]'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]"
          >
            {saving ? 'Saving…' : mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
