import React from 'react';
import { X, Info, Mail, ShieldCheck } from 'lucide-react';
import { getAccentTokens, type AccentColor } from '../constants/accentColors';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  accent?: AccentColor;
}

const APP_VERSION = 'v1.0.0';
const SUPPORT_EMAIL = 'support@moneymatter.app';

export function SupportModal({
  open,
  onClose,
  theme = 'dark',
  accent = 'green',
}: SupportModalProps) {
  if (!open) return null;

  const isDark = theme === 'dark';
  const t = getAccentTokens(theme, accent);
  const accentVars = {
    '--accent-solid': t.solid,
    '--accent-solid-hover': t.solidHover,
  } as React.CSSProperties;

  const labelClass = `flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider mb-3 ${isDark ? 'text-[#8e8ca0]' : 'text-[#767586]'}`;
  const rowClass = `flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 border ${
    isDark ? 'bg-[#201f1f] border-[#2d2c38]' : 'bg-[#f8f9ff] border-[#c7c4d7]'
  }`;

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
            Support
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
          {/* Basic Details */}
          <div>
            <label className={labelClass}>
              <Info size={13} />
              Basic Details
            </label>
            <div className="space-y-2">
              <div className={rowClass}>
                <span className={`text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>App</span>
                <span className={`text-[13px] font-semibold ${isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
                  MoneyMatter {APP_VERSION}
                </span>
              </div>
              <div className={rowClass}>
                <span className={`flex items-center gap-2 text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>
                  <Mail size={14} className={isDark ? 'text-[#8e8ca0]' : 'text-[#767586]'} />
                  Contact Support
                </span>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-[13px] font-semibold hover:underline"
                  style={{ color: t.solid }}
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div>
            <label className={labelClass}>
              <ShieldCheck size={13} />
              Privacy Policy
            </label>
            <div className={`rounded-xl px-3.5 py-3 border text-[13px] leading-relaxed ${
              isDark ? 'bg-[#201f1f] border-[#2d2c38] text-[#c7c4d7]' : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#464554]'
            }`}>
              Your data belongs to you. Everything you enter into MoneyMatter is stored locally on
              your own device — nothing is uploaded, synced, or shared with any third party. The
              app runs entirely offline, with no analytics, tracking, or account/cloud login
              required to use it.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
