import React, { useEffect, useRef, useState } from 'react';
import {
  PiggyBank,
  MinusCircle,
  ChartBarBig,
  FilePlusCorner,
  CirclePlus,
  CalendarDays,
  BanknoteArrowDown,
  Landmark,
  ChevronDown,
  Upload,
  Eye,
  Download,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { BANK_OPTIONS } from '../../constants/banks';
import { getAccentTokens, type AccentColor } from '../../constants/accentColors';
import { currencySymbol, type BaseCurrency } from '../../constants/currency';

export interface IncomeStreamOption {
  id: string;
  name: string;
  sourceType?: string;
  taxStatus?: string;
  bankAccount?: string;
}

export interface IncomeEntryFormData {
  id?: string;
  streamId: string;
  type: 'account' | 'cash';
  bank: string;
  status: 'taxed' | 'nontaxed';
  monthYear: string; // "MM/YY", required
  day: string; // "DD", optional
  amount: string;
  taxAmount: string;
  deductions: string;
  file: File | null;
}

export interface IncomeEntry {
  id: string;
  incomeStreamId: string;
  monthYear: string; // "MM/YY"
  day: string; // "DD", optional
  sourceType: string;
  taxStatus: string;
  bankAccount: string;
  amount: number;
  taxAmount: number;
  deductions: number;
  directories: string[];
  lastUpdated?: string;
}

interface IncomeOverviewProps {
  theme?: 'dark' | 'light';
  accent?: AccentColor;
  currency?: BaseCurrency;
  streams?: IncomeStreamOption[];
  entries?: IncomeEntry[];
  onOpenAddStream?: () => void;
  onEditStream?: (stream: IncomeStreamOption) => void;
  onSubmitEntry?: (data: IncomeEntryFormData) => void;
  onAddAttachment?: (entryId: string, file: File) => void;
  onViewAttachment?: (path: string) => void;
  onDownloadAttachment?: (path: string) => void;
  onDeleteAttachment?: (entryId: string, path: string) => void;
  onDeleteEntry?: (entryId: string) => void;
}

type Accent = 'green' | 'blue' | 'amber' | 'pink' | 'red';

const ACCENTS: Record<Accent, { lightBg: string; lightText: string; darkBg: string; darkText: string; bar: { light: string; dark: string } }> = {
  // .bar (Received/Deduction/Tax distribution chart) uses the same hex in
  // light and dark - re-validated via the dataviz skill's validate_palette.js
  // against both surfaces after the previous dark-mode values (#10b981/
  // #fbbf24/#818cf8) failed the dark lightness band (all measured L 0.68-0.84,
  // above the ~0.48-0.67 dark band - too pale/washed-out against the dark
  // surface). This set passes lightness band + contrast in both modes; the
  // green/amber adjacent pair sits in the CVD 6-8 floor band, legal here since
  // the chart already carries secondary encoding (legend + tooltip labels,
  // 2px surface-color gap between bars).
  green: { lightBg: '#d1fae5', lightText: '#065f46', darkBg: '#052e1c', darkText: '#6ee7b7', bar: { light: '#059669', dark: '#059669' } },
  blue: { lightBg: '#e0e7ff', lightText: '#3730a3', darkBg: '#1e1b4b', darkText: '#a5b4fc', bar: { light: '#6366f1', dark: '#6366f1' } },
  amber: { lightBg: '#fef3c7', lightText: '#92400e', darkBg: '#451a03', darkText: '#fcd34d', bar: { light: '#d97706', dark: '#d97706' } },
  pink: { lightBg: '#fce7f3', lightText: '#9d174d', darkBg: '#4a044e', darkText: '#f0abfc', bar: { light: '#db2777', dark: '#f472b6' } },
  red: { lightBg: '#fee2e2', lightText: '#991b1b', darkBg: '#450a0a', darkText: '#fca5a5', bar: { light: '#dc2626', dark: '#f87171' } },
};

// Six-hue categorical palette for per-income-stream identity (donut legend,
// diversity bar stacks) - fixed order, CVD-safe on both light and dark chart
// surfaces (validated via the dataviz skill's validate_palette.js, all six
// checks pass at this exact hex set/order on both surfaces, so unlike ACCENTS
// above it doesn't need separate light/dark values). Streams beyond this
// count fold into a single muted "Other" slice/series rather than reusing a
// slot (reusing would let two real streams share a color).
const STREAM_COLORS = ['#059669', '#6366f1', '#d97706', '#0891b2', '#7c3aed', '#db2777'];
const OTHER_STREAM_COLOR = '#8e8ca0';

interface StreamDisplayItem {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

// Assigns each stream a fixed, stable color slot in the order streams were
// created (never by value/rank, so filtering or amount changes never repaint
// a stream's color). Beyond STREAM_COLORS.length, the tail folds into one
// "Other" entry rather than cycling colors, so identity is never ambiguous.
function buildStreamDisplayList(streams: IncomeStreamOption[]): StreamDisplayItem[] {
  if (streams.length <= STREAM_COLORS.length) {
    return streams.map((s, i) => ({ id: s.id, name: s.name, color: STREAM_COLORS[i], memberIds: [s.id] }));
  }
  const head = streams.slice(0, STREAM_COLORS.length - 1).map((s, i) => ({
    id: s.id,
    name: s.name,
    color: STREAM_COLORS[i],
    memberIds: [s.id],
  }));
  const tail = streams.slice(STREAM_COLORS.length - 1);
  return [...head, { id: '__other__', name: 'Other', color: OTHER_STREAM_COLOR, memberIds: tail.map((s) => s.id) }];
}

function fmtMoney(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// A single comparable "period" key for a entry - a calendar month
// (year*12+month, same shape as monthKey()) normally, or just the year when
// bucketing has switched to yearly (see distinctMonthCount below).
function periodKeyOf(entry: IncomeEntry, yearly: boolean): number | null {
  const mk = entryMonthKey(entry.monthYear);
  if (mk === null) return null;
  return yearly ? Math.floor(mk / 12) : mk;
}

function periodLabel(key: number, yearly: boolean): string {
  if (yearly) return String(key);
  const year = Math.floor(key / 12);
  const month = (key % 12) + 1;
  const mm = String(month).padStart(2, '0');
  return `${MONTH_LABELS[mm] ?? mm} '${String(year).slice(-2)}`;
}

function distinctMonthCount(entries: IncomeEntry[]): number {
  const keys = new Set<number>();
  for (const p of entries) {
    const k = entryMonthKey(p.monthYear);
    if (k !== null) keys.add(k);
  }
  return keys.size;
}

interface PeriodTotals {
  received: number;
  deduction: number;
  tax: number;
}

interface PeriodBucket extends PeriodTotals {
  key: number;
  label: string;
  perStream: Record<string, number>;
}

function buildPeriodBuckets(entries: IncomeEntry[], yearly: boolean): PeriodBucket[] {
  const map = new Map<number, PeriodBucket>();
  for (const entry of entries) {
    const key = periodKeyOf(entry, yearly);
    if (key === null) continue;
    const bucket = map.get(key) ?? { key, label: periodLabel(key, yearly), received: 0, deduction: 0, tax: 0, perStream: {} };
    bucket.received += entry.amount;
    bucket.deduction += entry.deductions;
    bucket.tax += entry.taxAmount;
    bucket.perStream[entry.incomeStreamId] = (bucket.perStream[entry.incomeStreamId] ?? 0) + entry.amount;
    map.set(key, bucket);
  }
  return Array.from(map.values()).sort((a, b) => a.key - b.key);
}

// The two most recent periods that actually have data (not necessarily
// adjacent), so "vs last period" still works against sparse data instead of
// always reporting "no prior period".
function currentVsPreviousPeriod(entries: IncomeEntry[], yearly: boolean): { current: PeriodTotals | null; previous: PeriodTotals | null } {
  const buckets = buildPeriodBuckets(entries, yearly);
  const sorted = [...buckets].sort((a, b) => b.key - a.key);
  return { current: sorted[0] ?? null, previous: sorted[1] ?? null };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? null : null;
  return ((curr - prev) / prev) * 100;
}

const MONTH_OPTIONS = [
  ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'], ['04', 'Apr'],
  ['05', 'May'], ['06', 'Jun'], ['07', 'Jul'], ['08', 'Aug'],
  ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec'],
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH_MM = String(new Date().getMonth() + 1).padStart(2, '0');
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => String(CURRENT_YEAR - i));

const MONTH_LABELS: Record<string, string> = Object.fromEntries(MONTH_OPTIONS);

function formatEntryDate(entry: Pick<IncomeEntry, 'monthYear' | 'day'>): string {
  const [mm, yy] = entry.monthYear.split('/');
  const monthLabel = MONTH_LABELS[mm] ?? mm;
  return entry.day ? `${monthLabel} ${entry.day}, 20${yy}` : `${monthLabel} 20${yy}`;
}

function entrySortKey(entry: Pick<IncomeEntry, 'monthYear' | 'day'>): number {
  const [mm, yy] = entry.monthYear.split('/').map((v) => parseInt(v, 10) || 0);
  const day = parseInt(entry.day, 10) || 0;
  return yy * 10000 + mm * 100 + day;
}

// A single comparable key for a (month, 4-digit year) pair, month 1-12.
function monthKey(month: number, year: number): number {
  return year * 12 + (month - 1);
}

// A entry's MonthYear ("MM/YY") as the same comparable key, or null if
// it isn't in that format.
function entryMonthKey(monthYear: string): number | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(monthYear);
  if (!m) return null;
  return monthKey(parseInt(m[1], 10), 2000 + parseInt(m[2], 10));
}

const now = new Date();
const CURRENT_MONTH_KEY = monthKey(now.getMonth() + 1, now.getFullYear());
// The financial year (April-March) containing today.
const CURRENT_FY_START_YEAR = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;

// Inclusive [from, to] month-key bounds for a DateRange selection, or null
// for a range that shouldn't filter by date at all (Custom with neither
// side's Year set yet).
function dateRangeBounds(
  range: DateRange,
  custom: { fromMonth: string; fromYear: string; toMonth: string; toYear: string }
): { from: number; to: number } | null {
  switch (range) {
    case 'all':
      return null;
    case '1m':
      return { from: CURRENT_MONTH_KEY, to: CURRENT_MONTH_KEY };
    case '3m':
      return { from: CURRENT_MONTH_KEY - 2, to: CURRENT_MONTH_KEY };
    case '12m':
      return { from: CURRENT_MONTH_KEY - 11, to: CURRENT_MONTH_KEY };
    case 'currentfy':
      return { from: monthKey(4, CURRENT_FY_START_YEAR), to: monthKey(3, CURRENT_FY_START_YEAR + 1) };
    case 'previousfy':
      return { from: monthKey(4, CURRENT_FY_START_YEAR - 1), to: monthKey(3, CURRENT_FY_START_YEAR) };
    case 'custom': {
      // Month is optional on each side - a year alone still filters (From
      // defaults to January, To defaults to December). Only when a side has
      // no year at all is that side left unbounded; if neither side has a
      // year, nothing was entered yet, so don't filter at all.
      const { fromMonth, fromYear, toMonth, toYear } = custom;
      if (!fromYear && !toYear) return null;
      return {
        from: fromYear ? monthKey(fromMonth ? parseInt(fromMonth, 10) : 1, parseInt(fromYear, 10)) : -Infinity,
        to: toYear ? monthKey(toMonth ? parseInt(toMonth, 10) : 12, parseInt(toYear, 10)) : Infinity,
      };
    }
  }
}

type ViewMode = 'dashboard' | 'detailed';
type DateRange = 'all' | '1m' | '3m' | '12m' | 'currentfy' | 'previousfy' | 'custom';
type TaxFilter = 'all' | 'taxed' | 'nontaxed';
type AccountFilter = 'all' | 'account' | 'cash';
type StreamFilter = 'all' | string;

export function IncomeOverview({
  theme = 'dark',
  accent = 'green',
  currency = 'INR',
  streams = [],
  entries = [],
  onOpenAddStream = () => {},
  onEditStream = () => {},
  onSubmitEntry = (data) => console.log('Add income entry', data),
  onAddAttachment = () => {},
  onViewAttachment = () => {},
  onDownloadAttachment = () => {},
  onDeleteAttachment = () => {},
  onDeleteEntry = () => {},
}: IncomeOverviewProps) {
  const isDark = theme === 'dark';
  const symbol = currencySymbol(currency);
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
  const [customFromMonth, setCustomFromMonth] = useState('');
  const [customFromYear, setCustomFromYear] = useState('');
  const [customToMonth, setCustomToMonth] = useState('');
  const [customToYear, setCustomToYear] = useState('');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [taxFilter, setTaxFilter] = useState<TaxFilter>('all');
  const [streamFilter, setStreamFilter] = useState<StreamFilter>('all');
  const [streamFilterOpen, setStreamFilterOpen] = useState(false);
  const streamFilterRef = useRef<HTMLDivElement>(null);
  const [distributionMode, setDistributionMode] = useState<'distribution' | 'diversity'>('distribution');

  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryStreamId, setEntryStreamId] = useState('');
  const [entryType, setEntryType] = useState<'account' | 'cash'>('account');
  const [entryBank, setEntryBank] = useState(BANK_OPTIONS[0]);
  const [entryStatus, setEntryStatus] = useState<'taxed' | 'nontaxed'>('taxed');
  const [entryDay, setEntryDay] = useState('');
  const [entryMonth, setEntryMonth] = useState('');
  const [entryYear, setEntryYear] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryTaxAmount, setEntryTaxAmount] = useState('');
  const [entryDeductions, setEntryDeductions] = useState('');
  const [entryFile, setEntryFile] = useState<File | null>(null);
  const [entryHasAttachment, setEntryHasAttachment] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; sourceName: string } | null>(null);
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<{ entryId: string; path: string; sourceName: string } | null>(null);

  useEffect(() => {
    if (!streamFilterOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (streamFilterRef.current && !streamFilterRef.current.contains(e.target as Node)) {
        setStreamFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [streamFilterOpen]);

  const pillActive = 'bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]';
  const pillInactive = isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-white';
  const viewToggleActive = 'bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white shadow-sm';
  const viewToggleInactive = isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-white';

  const closeEntryModal = () => {
    setEntryModalOpen(false);
    setEditingEntryId(null);
    setEntryHasAttachment(false);
    setEntryStreamId('');
    setEntryType('account');
    setEntryBank(BANK_OPTIONS[0]);
    setEntryStatus('taxed');
    setEntryDay('');
    setEntryMonth('');
    setEntryYear('');
    setEntryAmount('');
    setEntryTaxAmount('');
    setEntryDeductions('');
    setEntryFile(null);
  };

  const handleEntryTypeChange = (type: 'account' | 'cash') => {
    setEntryType(type);
    setEntryStatus(type === 'account' ? 'taxed' : 'nontaxed');
    if (type === 'cash') setEntryBank(BANK_OPTIONS[0]);
  };

  // Applies a stream's source type/bank/tax status to the entry form -
  // used both when pre-filling from an already-selected stream and when the
  // user picks a different stream in the modal itself.
  const applyStreamDefaults = (stream: IncomeStreamOption) => {
    const type = stream.sourceType === 'cash' ? 'cash' : 'account';
    setEntryType(type);
    setEntryBank(type === 'account' && stream.bankAccount ? stream.bankAccount : BANK_OPTIONS[0]);
    setEntryStatus(stream.taxStatus === 'non_taxed' ? 'nontaxed' : 'taxed');
  };

  // Pre-fills the stream + its source type/bank/tax status when a specific
  // income stream is already selected (the header's stream dropdown), so
  // the user isn't re-entering details the app already knows. Also defaults
  // the date to the current month/year.
  const handleOpenEntryModal = () => {
    if (streamFilter !== 'all') {
      const selected = streams.find((s) => s.name === streamFilter);
      if (selected) {
        setEntryStreamId(selected.id);
        applyStreamDefaults(selected);
      }
    }
    setEntryMonth(CURRENT_MONTH_MM);
    setEntryYear(String(CURRENT_YEAR));
    setEntryModalOpen(true);
  };

  const handleEntryStreamChange = (streamId: string) => {
    setEntryStreamId(streamId);
    const selected = streams.find((s) => s.id === streamId);
    if (selected) applyStreamDefaults(selected);
  };

  // Pre-fills every field of the Add Income Entry modal from an existing entry
  // entry (the Detailed table's per-row edit button), so editing only
  // requires changing what's different rather than re-entering everything.
  const handleOpenEditEntry = (entry: IncomeEntry) => {
    setEditingEntryId(entry.id);
    setEntryStreamId(entry.incomeStreamId);
    const type = entry.sourceType === 'cash' ? 'cash' : 'account';
    setEntryType(type);
    setEntryBank(type === 'account' && entry.bankAccount ? entry.bankAccount : BANK_OPTIONS[0]);
    setEntryStatus(entry.taxStatus === 'non_taxed' ? 'nontaxed' : 'taxed');
    const [mm, yy] = entry.monthYear.split('/');
    setEntryMonth(mm ?? '');
    setEntryYear(yy ? `20${yy}` : '');
    setEntryDay(entry.day ?? '');
    setEntryAmount(entry.amount ? String(entry.amount) : '');
    setEntryTaxAmount(entry.taxAmount ? String(entry.taxAmount) : '');
    setEntryDeductions(entry.deductions ? String(entry.deductions) : '');
    setEntryFile(null);
    setEntryHasAttachment(entry.directories.length > 0);
    setEntryModalOpen(true);
  };

  const entryAmountValue = parseFloat(entryAmount);
  const entryAmountValid = entryAmount.trim() !== '' && !isNaN(entryAmountValue) && entryAmountValue >= 0.01;

  const handleSubmitEntry = () => {
    if (!entryStreamId || !entryMonth || !entryYear || !entryAmountValid) return;
    onSubmitEntry({
      id: editingEntryId ?? undefined,
      streamId: entryStreamId,
      type: entryType,
      bank: entryType === 'account' ? entryBank : BANK_OPTIONS[0],
      status: entryStatus,
      monthYear: `${entryMonth}/${entryYear.slice(-2)}`,
      day: entryDay,
      amount: entryAmount,
      taxAmount: entryStatus === 'taxed' ? entryTaxAmount : '',
      deductions: entryDeductions,
      file: entryFile,
    });
    closeEntryModal();
  };

  // Closes the Edit Income Entry modal and opens the existing Delete Income Entry
  // confirmation modal in its place - shared with the Detailed table's own
  // delete flow, just triggered from inside the edit modal instead of a
  // per-row button.
  const handleDeleteFromEditModal = () => {
    if (!editingEntryId) return;
    const sourceName = streams.find((s) => s.id === entryStreamId)?.name ?? 'Unknown Source';
    const id = editingEntryId;
    closeEntryModal();
    setDeleteTarget({ id, sourceName });
  };

  const dateBounds = dateRangeBounds(dateRange, {
    fromMonth: customFromMonth,
    fromYear: customFromYear,
    toMonth: customToMonth,
    toYear: customToYear,
  });

  // Stream/Tax/Account filters only (no Date) - shared with the "previous
  // period" comparison below, which needs to look further back than the
  // currently selected date window.
  const matchesNonDateFilters = (entry: IncomeEntry) => {
    const sourceName = streams.find((s) => s.id === entry.incomeStreamId)?.name ?? 'Unknown Source';
    const taxed = entry.taxStatus === 'taxed';
    const isCash = entry.sourceType === 'cash';
    return (
      (streamFilter === 'all' || sourceName === streamFilter) &&
      (taxFilter === 'all' || (taxFilter === 'taxed') === taxed) &&
      (accountFilter === 'all' || (accountFilter === 'cash') === isCash)
    );
  };

  // Shared by the Detailed table and every Dashboard stat/chart below, so
  // both views stay in sync with the same Date/Stream/Tax/Account filters.
  const filteredEntries = entries.filter((entry) => {
    const entryKey = entryMonthKey(entry.monthYear);
    return (
      matchesNonDateFilters(entry) &&
      (dateBounds === null || (entryKey !== null && entryKey >= dateBounds.from && entryKey <= dateBounds.to))
    );
  });

  const detailedRows = filteredEntries
    .map((entry) => ({
      entry,
      sourceName: streams.find((s) => s.id === entry.incomeStreamId)?.name ?? 'Unknown Source',
      taxed: entry.taxStatus === 'taxed',
      isCash: entry.sourceType === 'cash',
    }))
    .sort((a, b) => entrySortKey(b.entry) - entrySortKey(a.entry));

  // --- Dashboard aggregates (all derived from filteredEntries, so the
  // Dashboard reacts to the same filters as the Detailed table above) ---
  const totalReceived = filteredEntries.reduce((sum, p) => sum + p.amount, 0);
  const totalDeduction = filteredEntries.reduce((sum, p) => sum + p.deductions, 0);
  const totalTax = filteredEntries.reduce((sum, p) => sum + p.taxAmount, 0);

  // More than 23 distinct months of data switches every bucket-based
  // computation below (the "All"/incomplete-Custom stat-card comparison
  // fallback and the Row 2 bar chart) from monthly to yearly buckets.
  const yearlyBuckets = distinctMonthCount(filteredEntries) > 23;

  // Stat-card period-over-period % change. Only the named fixed-length date
  // filters (1M/3M/12M/Current FY/Previous FY) get a "than last N months"
  // suffix next to the badge - compared against the immediately preceding
  // window of that exact same length (e.g. 3M compares this 3-month span
  // against the 3 months right before it). "All" and "Custom" fall back to
  // the previous calendar-month/year bucket comparison with no suffix text
  // at all, since neither has one specific span to name.
  const hasNamedSpan = dateRange !== 'all' && dateRange !== 'custom';
  let periodPct: { received: number | null; deduction: number | null; tax: number | null };
  let periodLabelSuffix = '';
  if (hasNamedSpan && dateBounds !== null) {
    const span = dateBounds.to - dateBounds.from + 1;
    const prevFrom = dateBounds.from - span;
    const prevTo = dateBounds.from - 1;
    const prevEntries = entries.filter((entry) => {
      const entryKey = entryMonthKey(entry.monthYear);
      return matchesNonDateFilters(entry) && entryKey !== null && entryKey >= prevFrom && entryKey <= prevTo;
    });
    const prevReceived = prevEntries.reduce((sum, p) => sum + p.amount, 0);
    const prevDeduction = prevEntries.reduce((sum, p) => sum + p.deductions, 0);
    const prevTax = prevEntries.reduce((sum, p) => sum + p.taxAmount, 0);
    periodPct = {
      received: pctChange(totalReceived, prevReceived),
      deduction: pctChange(totalDeduction, prevDeduction),
      tax: pctChange(totalTax, prevTax),
    };
    periodLabelSuffix = ` than last ${span} month${span === 1 ? '' : 's'}`;
  } else {
    const { current: currentPeriod, previous: previousPeriod } = currentVsPreviousPeriod(filteredEntries, yearlyBuckets);
    periodPct = {
      received: currentPeriod && previousPeriod ? pctChange(currentPeriod.received, previousPeriod.received) : null,
      deduction: currentPeriod && previousPeriod ? pctChange(currentPeriod.deduction, previousPeriod.deduction) : null,
      tax: currentPeriod && previousPeriod ? pctChange(currentPeriod.tax, previousPeriod.tax) : null,
    };
  }

  const statCards: Array<{
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accent: Accent;
    value: number;
    pct: number | null;
    shareOfReceived: number | null;
  }> = [
    { label: 'Total Received', icon: PiggyBank, accent: 'green', value: totalReceived, pct: periodPct.received, shareOfReceived: totalReceived + totalDeduction + totalTax > 0 ? (totalReceived / (totalReceived + totalDeduction + totalTax)) * 100 : null },
    { label: 'Total Deduction', icon: MinusCircle, accent: 'amber', value: totalDeduction, pct: periodPct.deduction, shareOfReceived: totalReceived > 0 ? (totalDeduction / totalReceived) * 100 : null },
    { label: 'Total Tax', icon: Landmark, accent: 'blue', value: totalTax, pct: periodPct.tax, shareOfReceived: totalReceived > 0 ? (totalTax / totalReceived) * 100 : null },
  ];

  const streamDisplayList = buildStreamDisplayList(streams);
  const donutData = streamDisplayList.map((item) => ({
    ...item,
    value: filteredEntries.filter((p) => item.memberIds.includes(p.incomeStreamId)).reduce((sum, p) => sum + p.amount, 0),
  }));
  const activeDonutSlices = donutData.filter((d) => d.value > 0);
  // Sized to the longest stream name actually shown, so a chart with only
  // short names (e.g. "Rent") doesn't waste a fixed chunk of card width on
  // label gutter that the bars could use, while long names (e.g. "Consulting
  // & Advisory") still get enough room to avoid clipping.
  const diversityAxisWidth = Math.min(140, Math.max(56, Math.max(...activeDonutSlices.map((d) => d.name.length), 4) * 6.2 + 16));

  const periodBuckets = buildPeriodBuckets(filteredEntries, yearlyBuckets);
  const distributionChartData = periodBuckets.map((b) => {
    const row: Record<string, number | string> = { label: b.label, received: b.received, deduction: b.deduction, tax: b.tax };
    streamDisplayList.forEach((item) => {
      row[item.id] = item.memberIds.reduce((sum, id) => sum + (b.perStream[id] ?? 0), 0);
    });
    return row;
  });

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
            Income Stream &amp; Entry
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
            <div className="relative" ref={streamFilterRef}>
              <button
                type="button"
                onClick={() => setStreamFilterOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold tracking-wide transition-colors ${
                  viewMode === 'detailed' ? viewToggleActive : viewToggleInactive
                }`}
              >
                {streamFilter === 'all' ? 'All Income Streams' : streamFilter}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${streamFilterOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {streamFilterOpen && (
                <div
                  className={`absolute left-0 mt-2 w-56 rounded-xl shadow-2xl z-50 p-1.5 ${
                    isDark ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
                  }`}
                >
                  {(['all', ...streams] as Array<'all' | IncomeStreamOption>).map((item) => {
                    const name = item === 'all' ? 'all' : item.name;
                    return (
                      <div
                        key={name}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setViewMode('detailed');
                          setStreamFilter(name);
                          setStreamFilterOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setViewMode('detailed');
                            setStreamFilter(name);
                            setStreamFilterOpen(false);
                          }
                        }}
                        className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                          streamFilter === name
                            ? 'font-semibold bg-[var(--accent-pastel-bg)] text-[var(--accent-pastel-text)]'
                            : isDark
                            ? 'text-[#e5e2e1] hover:bg-[#2a2a2a]'
                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <span className="truncate">{item === 'all' ? 'All Income Streams' : item.name}</span>
                        {item !== 'all' && (
                          <button
                            type="button"
                            title={`Edit ${item.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStreamFilterOpen(false);
                              onEditStream(item);
                            }}
                            className={`p-1 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isDark
                                ? 'text-[#8e8ca0] hover:bg-[#353534] hover:text-[#e5e2e1]'
                                : 'text-[#767586] hover:bg-white hover:text-[#0b1c30]'
                            }`}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
              ['all', 'All'],
              ['1m', '1M'],
              ['3m', '3M'],
              ['12m', '12M'],
              ['currentfy', 'Current FY'],
              ['previousfy', 'Previous FY'],
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
              <select
                value={customFromMonth}
                onChange={(e) => setCustomFromMonth(e.target.value)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1] focus:border-[var(--accent-solid)]'
                    : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30] focus:border-[var(--accent-solid)]'
                }`}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={customFromYear}
                onChange={(e) => setCustomFromYear(e.target.value)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1] focus:border-[var(--accent-solid)]'
                    : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30] focus:border-[var(--accent-solid)]'
                }`}
              >
                <option value="">Year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className={`text-[12px] ${mutedText}`}>to</span>
              <select
                value={customToMonth}
                onChange={(e) => setCustomToMonth(e.target.value)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1] focus:border-[var(--accent-solid)]'
                    : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30] focus:border-[var(--accent-solid)]'
                }`}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={customToYear}
                onChange={(e) => setCustomToYear(e.target.value)}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1] focus:border-[var(--accent-solid)]'
                    : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30] focus:border-[var(--accent-solid)]'
                }`}
              >
                <option value="">Year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
          onClick={handleOpenEntryModal}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors ml-auto ${
            'bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]'
          }`}
        >
          <FilePlusCorner size={16} />
          Add Income Entry
        </button>
      </div>

      {viewMode === 'detailed' ? (
        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={isDark ? 'border-b border-[#2d2c38]/60' : 'border-b border-[#E2E8F0]'}>
                  {['Date', 'Source', 'Account', 'Tax Status', 'Received', 'Deductions', 'Tax', 'Attachment'].map((col) => (
                    <th
                      key={col}
                      className={`py-3 text-[11px] font-bold tracking-wider uppercase ${mutedText} ${
                        col === 'Attachment' ? 'pl-5 pr-5' : 'px-5'
                      }`}
                    >
                      {col === 'Attachment' ? (
                        <div className="flex items-center justify-between gap-2">
                          <span>Attachment</span>
                          <span>Action</span>
                        </div>
                      ) : (
                        col
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailedRows.map(({ entry, sourceName, taxed, isCash }) => (
                    <tr
                      key={entry.id}
                      className={isDark ? 'border-b border-[#2d2c38]/40 last:border-0' : 'border-b border-[#E2E8F0] last:border-0'}
                    >
                      <td className={`px-5 py-3.5 text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>{formatEntryDate(entry)}</td>
                      <td className={`px-5 py-3.5 text-[13px] font-medium ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{sourceName}</td>
                      <td className={`px-5 py-3.5 text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>
                        {isCash ? 'Cash' : entry.bankAccount && entry.bankAccount !== 'None' ? entry.bankAccount : 'Account'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                          style={{
                            backgroundColor: isDark ? ACCENTS.green.darkBg : ACCENTS.green.lightBg,
                            color: isDark ? ACCENTS.green.darkText : ACCENTS.green.lightText,
                          }}
                        >
                          {taxed ? 'Taxed' : 'Non-Taxed'}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-[13px] font-semibold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {fmtMoney(entry.amount, symbol)}
                      </td>
                      <td className={`px-5 py-3.5 text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>
                        {entry.deductions ? fmtMoney(entry.deductions, symbol) : '—'}
                      </td>
                      <td className={`px-5 py-3.5 text-[13px] ${isDark ? 'text-[#c7c4d7]' : 'text-[#464554]'}`}>
                        {taxed && entry.taxAmount
                          ? fmtMoney(entry.taxAmount, symbol)
                          : '—'}
                      </td>
                      <td className="pl-5 pr-5 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <label
                            title={entry.directories.length > 0 ? 'Attachment already added' : 'Add attachment'}
                            className={`p-1.5 rounded-md transition-colors ${
                              entry.directories.length > 0
                                ? `opacity-30 cursor-not-allowed ${isDark ? 'text-[#8e8ca0]' : 'text-[#767586]'}`
                                : `cursor-pointer ${
                                    isDark
                                      ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                                      : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                                  }`
                            }`}
                          >
                            <FilePlusCorner size={15} />
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              disabled={entry.directories.length > 0}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onAddAttachment(entry.id, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            title="View attachment"
                            disabled={entry.directories.length === 0}
                            onClick={() => onViewAttachment(entry.directories[entry.directories.length - 1])}
                            className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                              isDark
                                ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1] disabled:hover:bg-transparent disabled:hover:text-[#8e8ca0]'
                                : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30] disabled:hover:bg-transparent disabled:hover:text-[#767586]'
                            }`}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            title="Download attachment"
                            disabled={entry.directories.length === 0}
                            onClick={() => onDownloadAttachment(entry.directories[entry.directories.length - 1])}
                            className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                              isDark
                                ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1] disabled:hover:bg-transparent disabled:hover:text-[#8e8ca0]'
                                : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30] disabled:hover:bg-transparent disabled:hover:text-[#767586]'
                            }`}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            title="Remove attachment"
                            disabled={entry.directories.length === 0}
                            onClick={() =>
                              setDeleteAttachmentTarget({
                                entryId: entry.id,
                                path: entry.directories[entry.directories.length - 1],
                                sourceName,
                              })
                            }
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500"
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <button
                          type="button"
                          title="Edit income entry"
                          onClick={() => handleOpenEditEntry(entry)}
                          className={`p-1.5 rounded-md transition-colors shrink-0 ${
                            isDark
                              ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                              : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                          }`}
                        >
                          <Pencil size={15} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {detailedRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className={`px-5 py-8 text-center text-[13px] ${mutedText}`}>
                      {entries.length === 0 ? 'No entries recorded yet.' : 'No entries match the current filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
      {/* Row 1: Total Received / Deduction / Tax stat cards + Income Diversity donut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const accent = ACCENTS[card.accent];
          // Amber for "flat"/unknown (0% exactly, or no prior period to
          // compare against) so it reads as neutral rather than implying a
          // real gain (green) or loss (red).
          const pctAccent = card.pct === null ? ACCENTS.amber : ACCENTS[card.pct === 0 ? 'amber' : card.pct > 0 ? 'green' : 'red'];
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-2xl border p-5 ${cardBg}`}>
              <div className="flex items-start justify-between mb-4">
                <h3 className={`text-[17px] font-bold tracking-tight max-w-[70%] ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {card.label}
                </h3>
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isDark ? accent.darkBg : accent.lightBg, color: isDark ? accent.darkText : accent.lightText }}
                >
                  <Icon size={17} />
                </span>
              </div>
              <div className={`text-[28px] font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {fmtMoney(card.value, symbol)}
              </div>
              <div className="flex items-center gap-2 text-[12px] mb-1 flex-wrap">
                <span
                  className="px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ backgroundColor: isDark ? pctAccent.darkBg : pctAccent.lightBg, color: isDark ? pctAccent.darkText : pctAccent.lightText }}
                >
                  {card.pct === null
                    ? 'No prior amount to compare'
                    : `${card.pct >= 0 ? '+' : ''}${card.pct.toFixed(1)}%${periodLabelSuffix}`}
                </span>
              </div>
              {card.shareOfReceived !== null && (
                <div className={`text-[12px] mb-2 ${mutedText}`}>{card.shareOfReceived.toFixed(1)}% share of total income</div>
              )}
            </div>
          );
        })}

        <div className={`rounded-2xl border p-5 ${cardBg}`}>
          <div className="flex items-start justify-between mb-1">
            <h3 className={`text-[17px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
              Income Diversity
            </h3>
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: isDark ? ACCENTS.pink.darkBg : ACCENTS.pink.lightBg, color: isDark ? ACCENTS.pink.darkText : ACCENTS.pink.lightText }}
            >
              <ChartBarBig size={17} />
            </span>
          </div>
          {activeDonutSlices.length === 0 ? (
            <p className={`text-[13px] py-16 text-center ${mutedText}`}>No income recorded yet.</p>
          ) : (
            <div style={{ height: Math.max(140, activeDonutSlices.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeDonutSlices} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={gridColor} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={diversityAxisWidth}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? '#ffffff0d' : '#0000000d' }}
                    contentStyle={{
                      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                      border: `1px solid ${gridColor}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => fmtMoney(Number(value), symbol)}
                  />
                  <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    {activeDonutSlices.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(value) => `${totalReceived > 0 ? Math.round((Number(value) / totalReceived) * 100) : 0}%`}
                      style={{ fill: isDark ? '#e5e2e1' : '#0b1c30', fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Income Distribution / Income Diversity bar chart, monthly (or
          yearly once more than 23 distinct months are in view) */}
      <div className={`rounded-2xl border p-5 ${cardBg}`}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className={`text-[17px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
            Income Distribution
          </h3>
          <div className={`inline-flex items-center gap-1 p-1 rounded-xl border shrink-0 ${isDark ? 'bg-[#201f1f] border-[#2d2c38]/60' : 'bg-[#f8f9ff] border-[#E2E8F0]'}`}>
            <button
              onClick={() => setDistributionMode('distribution')}
              className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold tracking-wide transition-colors ${
                distributionMode === 'distribution' ? pillActive : pillInactive
              }`}
            >
              Income Distribution
            </button>
            <button
              onClick={() => setDistributionMode('diversity')}
              className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold tracking-wide transition-colors ${
                distributionMode === 'diversity' ? pillActive : pillInactive
              }`}
            >
              Income Diversity
            </button>
          </div>
        </div>

        {distributionChartData.length === 0 ? (
          <p className={`text-[13px] py-16 text-center ${mutedText}`}>No income recorded yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distributionChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${symbol}${Math.round(Number(v) / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: isDark ? '#ffffff0d' : '#0000000d' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    border: `1px solid ${gridColor}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [fmtMoney(Number(value), symbol), name]}
                />
                {distributionMode === 'distribution' ? (
                  <>
                    <Bar dataKey="received" fill={isDark ? ACCENTS.green.bar.dark : ACCENTS.green.bar.light} name="Received" radius={[4, 4, 0, 0]} stroke={isDark ? '#1a1a1a' : '#ffffff'} strokeWidth={2} />
                    <Bar dataKey="deduction" fill={isDark ? ACCENTS.amber.bar.dark : ACCENTS.amber.bar.light} name="Deduction" radius={[4, 4, 0, 0]} stroke={isDark ? '#1a1a1a' : '#ffffff'} strokeWidth={2} />
                    <Bar dataKey="tax" fill={isDark ? ACCENTS.blue.bar.dark : ACCENTS.blue.bar.light} name="Tax" radius={[4, 4, 0, 0]} stroke={isDark ? '#1a1a1a' : '#ffffff'} strokeWidth={2} />
                  </>
                ) : (
                  streamDisplayList.map((item) => (
                    <Bar
                      key={item.id}
                      dataKey={item.id}
                      fill={item.color}
                      name={item.name}
                      radius={[4, 4, 0, 0]}
                      stroke={isDark ? '#1a1a1a' : '#ffffff'}
                      strokeWidth={2}
                    />
                  ))
                )}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {(distributionMode === 'distribution'
                ? [
                    { label: 'Received', color: isDark ? ACCENTS.green.bar.dark : ACCENTS.green.bar.light },
                    { label: 'Deduction', color: isDark ? ACCENTS.amber.bar.dark : ACCENTS.amber.bar.light },
                    { label: 'Tax', color: isDark ? ACCENTS.blue.bar.dark : ACCENTS.blue.bar.light },
                  ]
                : streamDisplayList.map((item) => ({ label: item.name, color: item.color }))
              ).map((item) => (
                <span key={item.label} className={`flex items-center gap-1.5 text-[12px] font-medium ${mutedText}`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
        </>
      )}

      {/* Add Income Entry Modal */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeEntryModal} />
          <div
            className={`relative w-full max-w-xl rounded-2xl shadow-2xl p-6 ${
              isDark ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
                {editingEntryId ? 'Edit Income Entry' : 'Add Income Entry'}
              </h2>
              <button
                onClick={closeEntryModal}
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
                  value={entryStreamId}
                  onChange={(e) => handleEntryStreamChange(e.target.value)}
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
                      setEntryModalOpen(false);
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
                  <label className={labelClass}>Source Type</label>
                  <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-[#201f1f]' : 'bg-[#f8f9ff]'}`}>
                    {([
                      ['account', 'Account'],
                      ['cash', 'Cash'],
                    ] as Array<['account' | 'cash', string]>).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleEntryTypeChange(value)}
                        className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                          entryType === value ? pillActive : pillInactive
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {entryType === 'account' && (
                  <div className="flex-1">
                    <label className={labelClass}>Bank</label>
                    <select value={entryBank} onChange={(e) => setEntryBank(e.target.value)} className={inputClass}>
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
                      onClick={() => setEntryStatus(value)}
                      className={`px-4 py-1.5 rounded-md text-[12px] font-semibold tracking-wide transition-colors ${
                        entryStatus === value ? pillActive : pillInactive
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
                  <select value={entryDay} onChange={(e) => setEntryDay(e.target.value)} className={inputClass}>
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select required value={entryMonth} onChange={(e) => setEntryMonth(e.target.value)} className={inputClass}>
                    <option value="">Month</option>
                    {MONTH_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select required value={entryYear} onChange={(e) => setEntryYear(e.target.value)} className={inputClass}>
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
                <label className={labelClass}>
                  Received <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
                {entryAmount.trim() !== '' && !entryAmountValid && (
                  <p className="mt-1.5 text-[12px] font-medium text-red-400">Received must be at least 0.01.</p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={labelClass}>Deductions</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={entryDeductions}
                    onChange={(e) => setEntryDeductions(e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>

                {entryStatus === 'taxed' && (
                  <div className="flex-1">
                    <label className={labelClass}>Tax</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={entryTaxAmount}
                      onChange={(e) => setEntryTaxAmount(e.target.value)}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Upload Payslip / Proof of Income</label>
                <label
                  title={entryHasAttachment ? 'Attachment already added' : undefined}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px] border border-dashed transition-colors ${
                    entryHasAttachment
                      ? `opacity-30 cursor-not-allowed ${isDark ? 'bg-[#201f1f] border-[#2d2c38] text-[#8e8ca0]' : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#767586]'}`
                      : `cursor-pointer ${
                          isDark
                            ? 'bg-[#201f1f] border-[#2d2c38] text-[#8e8ca0] hover:border-[var(--accent-solid)]'
                            : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#767586] hover:border-[var(--accent-solid)]'
                        }`
                  }`}
                >
                  <Upload size={15} />
                  {entryHasAttachment ? 'Attachment already added' : entryFile ? entryFile.name : 'Choose a file'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    disabled={entryHasAttachment}
                    onChange={(e) => setEntryFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-7">
              {editingEntryId ? (
                <button
                  onClick={handleDeleteFromEditModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={closeEntryModal}
                  className={`px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors ${
                    isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-[#eff4ff]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEntry}
                  disabled={!entryStreamId || !entryMonth || !entryYear || !entryAmountValid}
                  className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    'bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]'
                  }`}
                >
                  {editingEntryId ? 'Save Changes' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Income Entry Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div
            className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 ${
              isDark ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
                Delete Income Entry
              </h2>
              <button
                onClick={() => setDeleteTarget(null)}
                className={`p-1.5 rounded-md transition-colors ${
                  isDark
                    ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                    : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                <X size={16} />
              </button>
            </div>
            <p className={`text-[13px] ${mutedText}`}>
              Are you sure you want to delete this {deleteTarget.sourceName} income entry? This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors ${
                  isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-[#eff4ff]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors bg-red-500 hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Attachment Confirmation */}
      {deleteAttachmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteAttachmentTarget(null)} />
          <div
            className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 ${
              isDark ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
                Remove Attachment
              </h2>
              <button
                onClick={() => setDeleteAttachmentTarget(null)}
                className={`p-1.5 rounded-md transition-colors ${
                  isDark
                    ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                    : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                <X size={16} />
              </button>
            </div>
            <p className={`text-[13px] ${mutedText}`}>
              Are you sure you want to remove the attachment on this {deleteAttachmentTarget.sourceName} entry? This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteAttachmentTarget(null)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors ${
                  isDark ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-[#eff4ff]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteAttachment(deleteAttachmentTarget.entryId, deleteAttachmentTarget.path);
                  setDeleteAttachmentTarget(null);
                }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors bg-red-500 hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
