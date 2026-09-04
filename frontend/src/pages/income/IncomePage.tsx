import React, { useState } from 'react';
import { FilePlus, X } from 'lucide-react';
import { IncomeOverview } from './IncomeOverview';
import { BANK_OPTIONS } from '../../constants/banks';
import { getAccentTokens, type AccentColor } from '../../constants/accentColors';

interface IncomeStream {
  id: string;
  name: string;
  taxable: boolean;
  type: 'account' | 'cash';
  bank: string;
}

interface IncomePageProps {
  theme?: 'dark' | 'light';
  accent?: AccentColor;
  onAddPayslip?: (stream: IncomeStream) => void;
}

export function IncomePage({
  theme = 'dark',
  accent = 'green',
  onAddPayslip = (stream) => console.log('Add payslip for', stream),
}: IncomePageProps) {
  const t = getAccentTokens(theme, accent);
  const accentVars = {
    '--accent-solid': t.solid,
    '--accent-solid-hover': t.solidHover,
    '--accent-pastel-bg': t.pastelBg,
    '--accent-pastel-text': t.pastelText,
    '--accent-hover-text': t.hoverText,
    '--accent-tint-bg': t.tintBg,
    '--accent-tint-border': t.tintBorder,
  } as React.CSSProperties;
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamTaxable, setNewStreamTaxable] = useState(true);
  const [newStreamType, setNewStreamType] = useState<'account' | 'cash'>('account');
  const [newStreamBank, setNewStreamBank] = useState(BANK_OPTIONS[0]);

  const activeStream = streams.find((s) => s.id === activeTab);

  const closeModal = () => {
    setModalOpen(false);
    setNewStreamName('');
    setNewStreamTaxable(true);
    setNewStreamType('account');
    setNewStreamBank(BANK_OPTIONS[0]);
  };

  const handleStreamTypeChange = (type: 'account' | 'cash') => {
    setNewStreamType(type);
    if (type === 'cash') setNewStreamBank(BANK_OPTIONS[0]);
  };

  const handleAddStream = () => {
    const name = newStreamName.trim();
    if (!name) return;
    const stream: IncomeStream = {
      id: Date.now().toString(),
      name,
      taxable: newStreamTaxable,
      type: newStreamType,
      bank: newStreamType === 'account' ? newStreamBank : BANK_OPTIONS[0],
    };
    setStreams((prev) => [...prev, stream]);
    setActiveTab(stream.id);
    closeModal();
  };

  return (
    <div style={accentVars}>
      {/* Sub-navbar */}
      {streams.length > 0 && (
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div
            className={`inline-flex items-center gap-1 p-1.5 rounded-full border ${
              theme === 'dark' ? 'bg-[#1a1a1a] border-[#2d2c38]/60' : 'bg-[#f8f9ff] border-[#E2E8F0]'
            }`}
          >
            {streams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setActiveTab(stream.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium tracking-wide transition-colors ${
                  activeTab === stream.id
                    ? 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)] font-semibold'
                    : theme === 'dark'
                    ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
                    : 'text-[#464554] hover:bg-white'
                }`}
              >
                {stream.name}
              </button>
            ))}
          </div>

          {activeStream && (
            <button
              onClick={() => activeStream && onAddPayslip(activeStream)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors shrink-0 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]"
            >
              <FilePlus size={16} />
              Add Payslip
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {!activeStream ? (
        <IncomeOverview theme={theme} accent={accent} streams={streams} onOpenAddStream={() => setModalOpen(true)} />
      ) : (
        <div
          className={`rounded-xl border p-6 ${
            theme === 'dark' ? 'bg-[#1a1a1a] border-[#2d2c38]/60' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>
            No payslips yet for {activeStream?.name}. Use "Add Payslip" to record one.
          </p>
        </div>
      )}

      {/* Add Income Stream Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div
            className={`relative w-full max-w-xl rounded-2xl shadow-2xl p-6 ${
              theme === 'dark' ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-[15px] font-semibold tracking-tight ${theme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
                Add Income Stream
              </h2>
              <button
                onClick={closeModal}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                    : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`block text-[10px] uppercase font-bold tracking-wider mb-2 ${theme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'}`}>
                  Income Stream Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStream()}
                  placeholder="e.g. Salary, Freelance"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors focus:border-[var(--accent-solid)] ${
                    theme === 'dark'
                      ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1]'
                      : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30]'
                  }`}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={`block text-[10px] uppercase font-bold tracking-wider mb-2 ${theme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'}`}>
                    Income Type
                  </label>
                  <div
                    className={`inline-flex rounded-lg p-1 ${theme === 'dark' ? 'bg-[#201f1f]' : 'bg-[#f8f9ff]'}`}
                  >
                    <button
                      onClick={() => handleStreamTypeChange('account')}
                      className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                        newStreamType === 'account'
                          ? 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]'
                          : theme === 'dark'
                          ? 'text-[#c7c4d7]'
                          : 'text-[#767586]'
                      }`}
                    >
                      Account
                    </button>
                    <button
                      onClick={() => handleStreamTypeChange('cash')}
                      className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                        newStreamType === 'cash'
                          ? 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]'
                          : theme === 'dark'
                          ? 'text-[#c7c4d7]'
                          : 'text-[#767586]'
                      }`}
                    >
                      Cash
                    </button>
                  </div>
                </div>

                {newStreamType === 'account' && (
                  <div className="flex-1">
                    <label className={`block text-[10px] uppercase font-bold tracking-wider mb-2 ${theme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'}`}>
                      Bank
                    </label>
                    <select
                      value={newStreamBank}
                      onChange={(e) => setNewStreamBank(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors focus:border-[var(--accent-solid)] ${
                        theme === 'dark'
                          ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1]'
                          : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30]'
                      }`}
                    >
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-[10px] uppercase font-bold tracking-wider mb-2 ${theme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'}`}>
                  Tax Status
                </label>
                <div
                  className={`inline-flex rounded-lg p-1 ${theme === 'dark' ? 'bg-[#201f1f]' : 'bg-[#f8f9ff]'}`}
                >
                  <button
                    onClick={() => setNewStreamTaxable(true)}
                    className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                      newStreamTaxable
                        ? 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]'
                        : theme === 'dark'
                        ? 'text-[#c7c4d7]'
                        : 'text-[#767586]'
                    }`}
                  >
                    Taxed
                  </button>
                  <button
                    onClick={() => setNewStreamTaxable(false)}
                    className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                      !newStreamTaxable
                        ? 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]'
                        : theme === 'dark'
                        ? 'text-[#c7c4d7]'
                        : 'text-[#767586]'
                    }`}
                  >
                    Non-Taxed
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-7">
              <button
                onClick={closeModal}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors ${
                  theme === 'dark'
                    ? 'text-[#c7c4d7] hover:bg-[#201f1f]'
                    : 'text-[#464554] hover:bg-[#eff4ff]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStream}
                disabled={!newStreamName.trim()}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]"
              >
                Add Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
