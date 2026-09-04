import React, { useState } from 'react';
import {
  PiggyBank,
  Briefcase,
  LineChart as LineChartIcon,
  FilePlusCorner,
  CirclePlus,
  CalendarDays,
  BanknoteArrowDown,
  Landmark,
  ChevronDown,
  Upload,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BANK_OPTIONS } from '../../constants/banks';
import { getAccentTokens, type AccentColor } from '../../constants/accentColors';

interface IncomeStreamOption {
  id: string;
  name: string;
}

export interface PayslipFormData {
  streamId: string;
  type: 'account' | 'cash';
  bank: string;
  status: 'taxed' | 'nontaxed';
  date: string;
  file: File | null;
}

interface IncomeOverviewProps {
  theme?: 'dark' | 'light';
  accent?: AccentColor;
  streams?: IncomeStreamOption[];
  onOpenAddStream?: () => void;
  onSubmitPayslip?: (data: PayslipFormData) => void;
}

type Accent = 'green' | 'blue' | 'amber' | 'pink';

const ACCENTS: Record<Accent, { lightBg: string; lightText: string; darkBg: string; darkText: string; bar: { light: string; dark: string } }> = {
  green: { lightBg: '#d1fae5', lightText: '#065f46', darkBg: '#052e1c', darkText: '#6ee7b7', bar: { light: '#059669', dark: '#10b981' } },
  blue: { lightBg: '#e0e7ff', lightText: '#3730a3', darkBg: '#1e1b4b', darkText: '#a5b4fc', bar: { light: '#4f46e5', dark: '#818cf8' } },
  amber: { lightBg: '#fef3c7', lightText: '#92400e', darkBg: '#451a03', darkText: '#fcd34d', bar: { light: '#d97706', dark: '#fbbf24' } },
  pink: { lightBg: '#fce7f3', lightText: '#9d174d', darkBg: '#4a044e', darkText: '#f0abfc', bar: { light: '#db2777', dark: '#f472b6' } },
};

const STAT_CARDS: Array<{
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: Accent;
  value: string;
  detailLeft: string;
  detailRight: string;
  updated: string;
}> = [
  {
    label: 'Total Monthly Inflow',
    icon: PiggyBank,
    accent: 'green',
    value: '$24,850.00',
    detailLeft: '+10.9%',
    detailRight: 'vs $22,400.00 last month',
    updated: 'Updated 2h ago',
  },
  {
    label: 'Primary Employment (Net)',
    icon: Briefcase,
    accent: 'blue',
    value: '$16,500.00',
    detailLeft: 'Fixed cadence (30th)',
    detailRight: '66.4% share',
    updated: 'Updated yesterday',
  },
  {
    label: 'Dividends & Capital Yield',
    icon: LineChartIcon,
    accent: 'amber',
    value: '$3,450.00',
    detailLeft: 'Run-rate: $41.4k/yr',
    detailRight: '+4.2% QoQ',
    updated: 'Updated 3d ago',
  },
  {
    label: 'Consulting & Advisory',
    icon: Briefcase,
    accent: 'pink',
    value: '$4,900.00',
    detailLeft: '2 Retainers Active',
    detailRight: '100% Collected',
    updated: 'Updated 5h ago',
  },
];

const TRAJECTORY_DATA = [
  { month: 'Nov', base: 12000, dividends: 3200, bonus: 2600 },
  { month: 'Dec', base: 12500, dividends: 3400, bonus: 6200 },
  { month: 'Jan', base: 13000, dividends: 2800, bonus: 2400 },
  { month: 'Feb', base: 13000, dividends: 3000, bonus: 2200 },
  { month: 'Mar', base: 13500, dividends: 3100, bonus: 2500 },
  { month: 'Apr', base: 14000, dividends: 3300, bonus: 4600 },
  { month: 'May', base: 14000, dividends: 3200, bonus: 2800 },
  { month: 'Jun', base: 14500, dividends: 3400, bonus: 3200 },
  { month: 'Jul', base: 15000, dividends: 3300, bonus: 2600 },
  { month: 'Aug', base: 15500, dividends: 3400, bonus: 2900 },
  { month: 'Sep', base: 16000, dividends: 3450, bonus: 3100 },
  { month: "Oct '24", base: 16500, dividends: 3450, bonus: 4900 },
].map((d) => ({ ...d, total: d.base + d.dividends + d.bonus }));

const DIVERSITY_DATA = [
  { name: 'Base Employment', value: 66, accent: 'blue' as Accent },
  { name: 'Dividends & Yield', value: 22, accent: 'amber' as Accent },
  { name: 'Bonus & Advisory', value: 12, accent: 'pink' as Accent },
];

const DETAILED_ENTRIES: Array<{
  date: string;
  source: string;
  account: string;
  taxed: boolean;
  amount: string;
}> = [
  { date: 'Oct 30, 2024', source: 'Primary Employment', account: 'Checking · Chase', taxed: true, amount: '$16,500.00' },
  { date: 'Oct 15, 2024', source: 'Dividends & Capital Yield', account: 'Savings · Ally', taxed: false, amount: '$1,725.00' },
  { date: 'Oct 05, 2024', source: 'Consulting & Advisory', account: 'Cash', taxed: true, amount: '$2,450.00' },
  { date: 'Sep 30, 2024', source: 'Primary Employment', account: 'Checking · Chase', taxed: true, amount: '$16,000.00' },
  { date: 'Sep 15, 2024', source: 'Dividends & Capital Yield', account: 'Savings · Ally', taxed: false, amount: '$1,725.00' },
];

const MONTH_OPTIONS = [
  ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'], ['04', 'Apr'],
  ['05', 'May'], ['06', 'Jun'], ['07', 'Jul'], ['08', 'Aug'],
  ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec'],
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => String(CURRENT_YEAR - i));

const DETAILED_SOURCES = Array.from(new Set(DETAILED_ENTRIES.map((entry) => entry.source)));

type ViewMode = 'dashboard' | 'detailed';
type DateRange = '1m' | '3m' | '12m' | 'currentfy' | 'previousfy' | 'next12m' | 'custom';
type TaxFilter = 'all' | 'taxed' | 'nontaxed';
type AccountFilter = 'all' | 'account' | 'cash';
type StreamFilter = 'all' | string;

export function IncomeOverview({
  theme = 'dark',
  accent = 'green',
  streams = [],
  onOpenAddStream = () => {},
  onSubmitPayslip = (data) => console.log('Add payslip', data),
}: IncomeOverviewProps) {
  const isDark = theme === 'dark';
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
  const cardBg = isDark ? 'bg-[#1a1a1a] border-[#2d2c38]/60' : 'bg-white border-[#E2E8F0]';
  const mutedText = isDark ? 'text-[#8e8ca0]' : 'text-[#767586]';
  const gridColor = isDark ? '#2d2c38' : '#e5e7eb';
  const axisColor = isDark ? '#8e8ca0' : '#767586';
  const labelClass = `block text-[10px] uppercase font-bold tracking-wider mb-2 ${mutedText}`;
  const inputClass = `w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-colors focus:border-[var(--accent-solid)] ${
    isDark
      ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1]'
      : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30]'
  }`;

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [dateRange, setDateRange] = useState<DateRange>('12m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [taxFilter, setTaxFilter] = useState<TaxFilter>('all');
  const [streamFilter, setStreamFilter] = useState<StreamFilter>('all');

  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [payslipStreamId, setPayslipStreamId] = useState('');
  const [payslipType, setPayslipType] = useState<'account' | 'cash'>('account');
  const [payslipBank, setPayslipBank] = useState(BANK_OPTIONS[0]);
  const [payslipStatus, setPayslipStatus] = useState<'taxed' | 'nontaxed'>('taxed');
  const [payslipDay, setPayslipDay] = useState('');
  const [payslipMonth, setPayslipMonth] = useState('');
  const [payslipYear, setPayslipYear] = useState('');
  const [payslipFile, setPayslipFile] = useState<File | null>(null);

  const pillActive = 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]';
  const pillInactive = isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-white';
  const viewToggleActive = 'bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white shadow-sm';
  const viewToggleInactive = isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-white';

  const closePayslipModal = () => {
    setPayslipModalOpen(false);
    setPayslipStreamId('');
    setPayslipType('account');
    setPayslipBank(BANK_OPTIONS[0]);
    setPayslipStatus('taxed');
    setPayslipDay('');
    setPayslipMonth('');
    setPayslipYear('');
    setPayslipFile(null);
  };

  const handlePayslipTypeChange = (type: 'account' | 'cash') => {
    setPayslipType(type);
    setPayslipStatus(type === 'account' ? 'taxed' : 'nontaxed');
    if (type === 'cash') setPayslipBank(BANK_OPTIONS[0]);
  };

  const handleSubmitPayslip = () => {
    if (!payslipStreamId || !payslipMonth || !payslipYear) return;
    onSubmitPayslip({
      streamId: payslipStreamId,
      type: payslipType,
      bank: payslipType === 'account' ? payslipBank : BANK_OPTIONS[0],
      status: payslipStatus,
      date: `${payslipYear}-${payslipMonth}-${payslipDay || '01'}`,
      file: payslipFile,
    });
    closePayslipModal();
  };

  return (
    <div className="space-y-6" style={accentVars}>
      {/* Header card */}
      <div
        className={`rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5 ${
          isDark ? 'bg-[var(--accent-tint-bg)]/30 border-[var(--accent-tint-border)]/40' : 'bg-[var(--accent-tint-bg)] border-[var(--accent-tint-border)]'
        }`}
      >
        <div>
          <h2 className={`text-[22px] font-bold tracking-tight mb-1.5 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
            Income Stream &amp; Payslip
          </h2>
          <p className={`text-[13px] max-w-md ${mutedText}`}>
            Salary slips, dividend yields and cash generation.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`inline-flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
              isDark ? 'bg-[#1a1a1a] border-[#2d2c38]/60' : 'bg-white border-[var(--accent-tint-border)]'
            }`}
          >
            <button
              onClick={() => {
                setViewMode('dashboard');
                setStreamFilter('all');
              }}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold tracking-wide transition-colors ${
                viewMode === 'dashboard' ? viewToggleActive : viewToggleInactive
              }`}
            >
              Dashboard
            </button>
            <div
              className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold tracking-wide transition-colors ${
                viewMode === 'detailed' ? viewToggleActive : viewToggleInactive
              }`}
            >
              {streamFilter === 'all' ? 'All Income Streams' : streamFilter}
              <ChevronDown size={14} />
              <select
                value={streamFilter}
                onClick={() => setViewMode('detailed')}
                onChange={(e) => {
                  setViewMode('detailed');
                  setStreamFilter(e.target.value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer outline-none"
                style={{ color: isDark ? '#e5e2e1' : '#0b1c30' }}
              >
                <option value="all">All Income Streams</option>
                {DETAILED_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={onOpenAddStream}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors ${
              'bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]'
            }`}
          >
            <CirclePlus size={16} />
            Add Income Stream
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border p-4 flex flex-wrap items-center gap-4 ${cardBg}`}>
        {/* Date range */}
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays size={15} className={mutedText} />
          <div className={`inline-flex items-center gap-1 p-1 rounded-full border ${isDark ? 'bg-[#201f1f] border-[#2d2c38]/60' : 'bg-[#f8f9ff] border-[#E2E8F0]'}`}>
            {([
              ['1m', '1M'],
              ['3m', '3M'],
              ['12m', '12M'],
              ['currentfy', 'Current FY'],
              ['previousfy', 'Previous FY'],
              ['next12m', 'Next 12M'],
              ['custom', 'Custom'],
            ] as Array<[DateRange, string]>).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setDateRange(value)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium tracking-wide transition-colors ${
                  dateRange === value ? `${pillActive} font-semibold` : pillInactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1] focus:border-[var(--accent-solid)]'
                    : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30] focus:border-[var(--accent-solid)]'
                }`}
              />
              <span className={`text-[12px] ${mutedText}`}>to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1] focus:border-[var(--accent-solid)]'
                    : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30] focus:border-[var(--accent-solid)]'
                }`}
              />
            </div>
          )}
        </div>

        <div className={`w-px h-6 ${isDark ? 'bg-[#2d2c38]' : 'bg-[#E2E8F0]'}`} />

        {/* Account / Cash */}
        <div className="flex items-center gap-2">
          <BanknoteArrowDown size={15} className={mutedText} />
          <div className={`inline-flex items-center gap-1 p-1 rounded-full border ${isDark ? 'bg-[#201f1f] border-[#2d2c38]/60' : 'bg-[#f8f9ff] border-[#E2E8F0]'}`}>
            {([
              ['all', 'All'],
              ['account', 'Account'],
              ['cash', 'Cash'],
            ] as Array<[AccountFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAccountFilter(value)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium tracking-wide transition-colors ${
                  accountFilter === value ? `${pillActive} font-semibold` : pillInactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={`w-px h-6 ${isDark ? 'bg-[#2d2c38]' : 'bg-[#E2E8F0]'}`} />

        {/* Taxed / Non-taxed */}
        <div className="flex items-center gap-2">
          <Landmark size={15} className={mutedText} />
          <div className={`inline-flex items-center gap-1 p-1 rounded-full border ${isDark ? 'bg-[#201f1f] border-[#2d2c38]/60' : 'bg-[#f8f9ff] border-[#E2E8F0]'}`}>
            {([
              ['all', 'All'],
              ['taxed', 'Taxed'],
              ['nontaxed', 'Non-Taxed'],
            ] as Array<[TaxFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTaxFilter(value)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium tracking-wide transition-colors ${
                  taxFilter === value ? `${pillActive} font-semibold` : pillInactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setPayslipModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors ml-auto ${
            'bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]'
          }`}
        >
          <FilePlusCorner size={16} />
          Add Payslip
        </button>
      </div>

      {viewMode === 'detailed' ? (
        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={isDark ? 'border-b border-[#2d2c38]/60' : 'border-b border-[#E2E8F0]'}>
                  {['Date', 'Source', 'Account', 'Tax Status', 'Amount'].map((col) => (
                    <th
                      key={col}
                      className={`px-5 py-3 text-[11px] font-bold tracking-wider uppercase ${mutedText}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DETAILED_ENTRIES.filter(
                  (entry) =>
                    (streamFilter === 'all' || entry.source === streamFilter) &&
                    (taxFilter === 'all' || (taxFilter === 'taxed') === entry.taxed) &&
                    (accountFilter === 'all' || (accountFilter === 'cash') === (entry.account === 'Cash'))
                ).map((entry, i) => (
                  <tr
                    key={i}
                    className={isDark ? 'border-b border-[#2d2c38]/40 last:border-0' : 'border-b border-[#E2E8F0] last:border-0'}
                  >
                    <td className={`px-5 py-3.5 text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>{entry.date}</td>
                    <td className={`px-5 py-3.5 text-[13px] font-medium ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{entry.source}</td>
                    <td className={`px-5 py-3.5 text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>{entry.account}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                        style={{
                          backgroundColor: isDark ? ACCENTS.green.darkBg : ACCENTS.green.lightBg,
                          color: isDark ? ACCENTS.green.darkText : ACCENTS.green.lightText,
                        }}
                      >
                        {entry.taxed ? 'Taxed' : 'Non-Taxed'}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-[13px] font-semibold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{entry.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const accent = ACCENTS[card.accent];
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-2xl border p-5 ${cardBg}`}>
              <div className="flex items-start justify-between mb-4">
                <span className={`text-[11px] font-bold tracking-wider uppercase max-w-[70%] ${mutedText}`}>
                  {card.label}
                </span>
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isDark ? accent.darkBg : accent.lightBg, color: isDark ? accent.darkText : accent.lightText }}
                >
                  <Icon size={17} />
                </span>
              </div>
              <div className={`text-[22px] font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {card.value}
              </div>
              <div className="flex items-center gap-2 text-[12px] mb-2">
                <span
                  className="px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ backgroundColor: isDark ? accent.darkBg : accent.lightBg, color: isDark ? accent.darkText : accent.lightText }}
                >
                  {card.detailLeft}
                </span>
                <span className={mutedText}>{card.detailRight}</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-[#6b697b]' : 'text-[#9a98a8]'}`}>{card.updated}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 rounded-2xl border p-5 ${cardBg}`}>
          <span className={`text-[11px] font-bold tracking-wider uppercase ${mutedText}`}>Trajectory &amp; Seasonality</span>
          <h3 className={`text-[17px] font-bold tracking-tight mt-1 mb-4 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
            12-Month Inflow Trajectory
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={TRAJECTORY_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  border: `1px solid ${gridColor}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Bar dataKey="base" stackId="a" fill={isDark ? ACCENTS.blue.bar.dark : ACCENTS.blue.bar.light} name="Base Salary" radius={[0, 0, 0, 0]} />
              <Bar dataKey="dividends" stackId="a" fill={isDark ? ACCENTS.amber.bar.dark : ACCENTS.amber.bar.light} name="Dividends & Yield" />
              <Bar
                dataKey="bonus"
                stackId="a"
                fill={isDark ? ACCENTS.pink.bar.dark : ACCENTS.pink.bar.light}
                name="Bonus & Advisory"
                radius={[6, 6, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={isDark ? '#e5e2e1' : '#0b1c30'}
                strokeWidth={2}
                dot={false}
                name="Total"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {[
              { label: 'Base Salary', accent: 'blue' as Accent },
              { label: 'Dividends & Yield', accent: 'amber' as Accent },
              { label: 'Bonus & Advisory', accent: 'pink' as Accent },
            ].map((item) => (
              <span key={item.label} className={`flex items-center gap-1.5 text-[12px] font-medium ${mutedText}`}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isDark ? ACCENTS[item.accent].bar.dark : ACCENTS[item.accent].bar.light }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${cardBg}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-[11px] font-bold tracking-wider uppercase ${mutedText}`}>Asset Resilience</span>
              <h3 className={`text-[17px] font-bold tracking-tight mt-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                Income Diversity Index
              </h3>
            </div>
            <span
              className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]'
              }`}
            >
              High (0.84)
            </span>
          </div>
          <div className="relative" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DIVERSITY_DATA}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {DIVERSITY_DATA.map((entry) => (
                    <Cell key={entry.name} fill={isDark ? ACCENTS[entry.accent].bar.dark : ACCENTS[entry.accent].bar.light} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-[26px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>3</span>
              <span className={`text-[10px] font-bold tracking-wider uppercase ${mutedText}`}>Pillars</span>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {DIVERSITY_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[12px]">
                <span className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isDark ? ACCENTS[item.accent].bar.dark : ACCENTS[item.accent].bar.light }}
                  />
                  {item.name}
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Add Payslip Modal */}
      {payslipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={closePayslipModal} />
          <div
            className={`relative w-full max-w-xl rounded-2xl shadow-2xl p-6 ${
              isDark ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
                Add Payslip
              </h2>
              <button
                onClick={closePayslipModal}
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
              <div>
                <label className={labelClass}>
                  Income Stream <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  disabled={streams.length === 0}
                  value={payslipStreamId}
                  onChange={(e) => setPayslipStreamId(e.target.value)}
                  className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {streams.length === 0 ? (
                    <option value="">Add Income Stream</option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Select income stream
                      </option>
                      {streams.map((stream) => (
                        <option key={stream.id} value={stream.id}>
                          {stream.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {streams.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayslipModalOpen(false);
                      onOpenAddStream();
                    }}
                    className={`mt-2 text-[12px] font-semibold tracking-wide hover:text-[var(--accent-hover-text)] ${isDark ? 'text-[var(--accent-pastel-text)]' : 'text-[var(--accent-solid)]'}`}
                  >
                    + Add an income stream first
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={labelClass}>Income Type</label>
                  <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-[#201f1f]' : 'bg-[#f8f9ff]'}`}>
                    {([
                      ['account', 'Account'],
                      ['cash', 'Cash'],
                    ] as Array<['account' | 'cash', string]>).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handlePayslipTypeChange(value)}
                        className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                          payslipType === value ? pillActive : pillInactive
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {payslipType === 'account' && (
                  <div className="flex-1">
                    <label className={labelClass}>Bank</label>
                    <select value={payslipBank} onChange={(e) => setPayslipBank(e.target.value)} className={inputClass}>
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
                <label className={labelClass}>Tax Status</label>
                <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-[#201f1f]' : 'bg-[#f8f9ff]'}`}>
                  {([
                    ['taxed', 'Taxed'],
                    ['nontaxed', 'Non-Taxed'],
                  ] as Array<['taxed' | 'nontaxed', string]>).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPayslipStatus(value)}
                      className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                        payslipStatus === value ? pillActive : pillInactive
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Date <span className="text-red-400">*</span>{' '}
                  <span className={`normal-case font-medium tracking-normal ${mutedText}`}>(day optional)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select value={payslipDay} onChange={(e) => setPayslipDay(e.target.value)} className={inputClass}>
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select required value={payslipMonth} onChange={(e) => setPayslipMonth(e.target.value)} className={inputClass}>
                    <option value="">Month</option>
                    {MONTH_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select required value={payslipYear} onChange={(e) => setPayslipYear(e.target.value)} className={inputClass}>
                    <option value="">Year</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Upload Payslip / Proof of Income</label>
                <label
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px] border border-dashed cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-[#201f1f] border-[#2d2c38] text-[#8e8ca0] hover:border-[var(--accent-solid)]'
                      : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#767586] hover:border-[var(--accent-solid)]'
                  }`}
                >
                  <Upload size={15} />
                  {payslipFile ? payslipFile.name : 'Choose a file'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => setPayslipFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-7">
              <button
                onClick={closePayslipModal}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors ${
                  isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-[#eff4ff]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayslip}
                disabled={!payslipStreamId || !payslipMonth || !payslipYear}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  'bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
