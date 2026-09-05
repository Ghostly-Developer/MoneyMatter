import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { IncomeOverview, type IncomeStreamOption, type IncomeEntryFormData } from './IncomeOverview';
import { BANK_OPTIONS } from '../../constants/banks';
import { getAccentTokens, type AccentColor } from '../../constants/accentColors';
import type { BaseCurrency } from '../../constants/currency';
import {
  CreateIncomeEntry,
  CreateIncomeStream,
  DeleteIncomeAttachment,
  DeleteIncomeEntry,
  DeleteIncomeStream,
  ListIncomeEntries,
  ListIncomeStreams,
  ReadIncomeAttachment,
  SaveIncomeAttachment,
  UpdateIncomeEntry,
  UpdateIncomeStream,
} from '../../../wailsjs/go/main/App';
import { income } from '../../../wailsjs/go/models';
import { isMockMode } from '../../utils/mock';
import { MOCK_INCOME_STREAMS, MOCK_INCOME_ENTRIES } from '../../mocks/income';

interface IncomePageProps {
  theme?: 'dark' | 'light';
  accent?: AccentColor;
  currency?: BaseCurrency;
  profileId: string;
}

export function IncomePage({
  theme = 'dark',
  accent = 'green',
  currency = 'INR',
  profileId,
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
  const [streams, setStreams] = useState<income.Stream[]>([]);
  const [entries, setEntries] = useState<income.Entry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamTaxable, setNewStreamTaxable] = useState(true);
  const [newStreamType, setNewStreamType] = useState<'account' | 'cash'>('account');
  const [newStreamBank, setNewStreamBank] = useState(BANK_OPTIONS[0]);
  const [creatingStream, setCreatingStream] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [preview, setPreview] = useState<{ url: string; name: string; type: 'pdf' | 'image'; mock?: boolean } | null>(null);
  const [deleteStreamTarget, setDeleteStreamTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingStream, setDeletingStream] = useState(false);
  const [deleteStreamError, setDeleteStreamError] = useState('');

  // Load this profile's income streams + entries from the local SQLite
  // store (internal/income) whenever the active profile changes.
  useEffect(() => {
    if (!profileId) return;
    if (isMockMode()) {
      setStreams(MOCK_INCOME_STREAMS);
      setEntries(MOCK_INCOME_ENTRIES);
      return;
    }
    let cancelled = false;
    ListIncomeStreams(profileId)
      .then((list) => !cancelled && setStreams(list ?? []))
      .catch((err) => console.error('Failed to load income streams:', err));
    ListIncomeEntries(profileId, '', '')
      .then((list) => !cancelled && setEntries(list ?? []))
      .catch((err) => console.error('Failed to load income entries:', err));
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingStreamId(null);
    setNewStreamName('');
    setNewStreamTaxable(true);
    setNewStreamType('account');
    setNewStreamBank(BANK_OPTIONS[0]);
    setStreamError('');
  };

  const handleStreamTypeChange = (type: 'account' | 'cash') => {
    setNewStreamType(type);
    if (type === 'cash') setNewStreamBank(BANK_OPTIONS[0]);
  };

  // Prefills the Add/Edit Income Stream modal from an existing stream (the
  // dropdown's per-row edit button) so the user only has to change what's
  // different.
  const handleEditStream = (stream: IncomeStreamOption) => {
    const full = streams.find((s) => s.id === stream.id);
    if (!full) return;
    setEditingStreamId(full.id);
    setNewStreamName(full.name);
    setNewStreamTaxable(full.taxStatus !== 'non_taxed');
    setNewStreamType(full.sourceType === 'cash' ? 'cash' : 'account');
    setNewStreamBank(full.sourceType === 'account' && full.bankAccount ? full.bankAccount : BANK_OPTIONS[0]);
    setStreamError('');
    setModalOpen(true);
  };

  const handleAddStream = async () => {
    const name = newStreamName.trim();
    if (!name || !profileId) return;

    setCreatingStream(true);
    setStreamError('');
    try {
      if (editingStreamId) {
        const existing = streams.find((s) => s.id === editingStreamId);
        if (!existing) return;
        const draft = new income.Stream({
          ...existing,
          name,
          sourceType: newStreamType,
          taxStatus: newStreamTaxable ? 'taxed' : 'non_taxed',
          bankAccount: newStreamType === 'account' ? newStreamBank : '',
        });
        const updated = isMockMode()
          ? new income.Stream({ ...draft, lastUpdated: new Date().toISOString() })
          : await UpdateIncomeStream(draft);
        setStreams((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const draft = new income.Stream({
          profileId,
          name,
          sourceType: newStreamType,
          taxStatus: newStreamTaxable ? 'taxed' : 'non_taxed',
          bankAccount: newStreamType === 'account' ? newStreamBank : '',
        });
        const created = isMockMode()
          ? new income.Stream({ ...draft, id: `mock-stream-${Date.now()}`, lastUpdated: new Date().toISOString() })
          : await CreateIncomeStream(draft);
        setStreams((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) {
      console.error(editingStreamId ? 'Failed to update income stream:' : 'Failed to create income stream:', err);
      setStreamError(editingStreamId ? 'Could not update that stream — try again.' : 'Could not create that stream — try a different name.');
    } finally {
      setCreatingStream(false);
    }
  };

  const handleDeleteStream = async () => {
    if (!deleteStreamTarget) return;
    setDeletingStream(true);
    setDeleteStreamError('');
    try {
      if (!isMockMode()) {
        await DeleteIncomeStream(profileId, deleteStreamTarget.id);
      }
      setStreams((prev) => prev.filter((s) => s.id !== deleteStreamTarget.id));
      setEntries((prev) => prev.filter((e) => e.incomeStreamId !== deleteStreamTarget.id));
      setDeleteStreamTarget(null);
      closeModal();
    } catch (err) {
      console.error('Failed to delete income stream:', err);
      setDeleteStreamError('Could not delete that stream — try again.');
    } finally {
      setDeletingStream(false);
    }
  };

  // Strips filesystem-illegal characters from a name component and
  // collapses whitespace to underscores, so it's safe to use inside a
  // saved attachment's filename.
  const sanitizeFileNamePart = (value: string) =>
    value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim().replace(/\s+/g, '_') || 'file';

  // How many attachments this stream already has across every one of its
  // entries - used as the running "count" in the saved filename below, so
  // each attachment in a stream gets a distinct number.
  const streamAttachmentCount = (streamId: string) =>
    entries
      .filter((e) => e.incomeStreamId === streamId)
      .reduce((sum, e) => sum + e.directories.length, 0);

  // Uploads a file into <profile>/income/<stream>/, saved as
  // "<StreamName>_<Date>_<count>.<ext>" (date is the entry's MonthYear,
  // prefixed with Day when set; count is this stream's running attachment
  // count so far, making each attachment's filename distinct) and appends
  // the saved path to the entry's Directories via UpdateIncomeEntry. Shared
  // by the initial Add Income Entry modal upload and the Detailed table's
  // per-row attachment button. Mock mode has no real backend to write to,
  // so it just records the picked file's name.
  const attachFile = async (entry: income.Entry, streamName: string, file: File): Promise<income.Entry> => {
    if (isMockMode()) {
      return new income.Entry({ ...entry, directories: [...entry.directories, file.name] });
    }
    const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
    const dateStr = (entry.day ? `${entry.day}-` : '') + entry.monthYear.replace('/', '-');
    const extDot = file.name.lastIndexOf('.');
    const ext = extDot > -1 ? file.name.slice(extDot) : '';
    const count = streamAttachmentCount(entry.incomeStreamId) + 1;
    const fileName = `${sanitizeFileNamePart(streamName)}_${sanitizeFileNamePart(dateStr)}_${count}${ext}`;
    const savedPath = await SaveIncomeAttachment(profileId, streamName, fileName, bytes);
    return UpdateIncomeEntry(profileId, new income.Entry({ ...entry, directories: [...entry.directories, savedPath] }));
  };

  const handleSubmitEntry = async (data: IncomeEntryFormData) => {
    const stream = streams.find((s) => s.id === data.streamId);
    if (!stream || !profileId) return;

    const fields = {
      incomeStreamId: stream.id,
      monthYear: data.monthYear,
      day: data.day,
      sourceType: data.type,
      taxStatus: data.status === 'taxed' ? 'taxed' : 'non_taxed',
      bankAccount: data.type === 'account' ? data.bank : '',
      amount: parseFloat(data.amount) || 0,
      taxAmount: data.status === 'taxed' ? parseFloat(data.taxAmount) || 0 : 0,
      deductions: parseFloat(data.deductions) || 0,
    };

    try {
      if (data.id) {
        const existing = entries.find((e) => e.id === data.id);
        if (!existing) return;
        const draft = new income.Entry({ ...existing, ...fields });
        let updated = isMockMode()
          ? new income.Entry({ ...draft, lastUpdated: new Date().toISOString() })
          : await UpdateIncomeEntry(profileId, draft);
        if (data.file) {
          updated = await attachFile(updated, stream.name, data.file);
        }
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        return;
      }

      const draft = new income.Entry({
        name: `${stream.name} Entry ${data.monthYear} (${Math.random().toString(36).slice(2, 6)})`,
        ...fields,
        directories: [],
      });
      let created = isMockMode()
        ? new income.Entry({ ...draft, id: `mock-entry-${Date.now()}`, lastUpdated: new Date().toISOString() })
        : await CreateIncomeEntry(profileId, draft);
      if (data.file) {
        created = await attachFile(created, stream.name, data.file);
      }
      setEntries((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Failed to save income entry:', err);
    }
  };

  const handleAddAttachment = async (entryId: string, file: File) => {
    const entry = entries.find((e) => e.id === entryId);
    const stream = entry && streams.find((s) => s.id === entry.incomeStreamId);
    if (!entry || !stream) return;

    try {
      const updated = await attachFile(entry, stream.name, file);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)));
    } catch (err) {
      console.error('Failed to add attachment:', err);
    }
  };

  const handleDeleteAttachment = async (entryId: string, path: string) => {
    if (!path) return;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    try {
      const updated = isMockMode()
        ? new income.Entry({ ...entry, directories: entry.directories.filter((d) => d !== path) })
        : await DeleteIncomeAttachment(profileId, entryId, path);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)));
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      if (!isMockMode()) {
        await DeleteIncomeEntry(profileId, entryId);
      }
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      console.error('Failed to delete income entry:', err);
    }
  };

  const downloadAttachmentFilename = (path: string) => path.split(/[\\/]/).pop() || 'attachment';

  const mimeTypeForPath = (path: string): string => {
    const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  };

  // ReadIncomeAttachment's TS signature claims Promise<number[]>, but the
  // Wails v2 runtime actually hands back a base64 string for []byte returns
  // at this version - handle both shapes so a payload from either encoding
  // decodes to the real file bytes instead of silently corrupting them.
  const toUint8Array = (data: number[] | string): Uint8Array<ArrayBuffer> => {
    if (typeof data === 'string') {
      const binary = atob(data);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      return arr;
    }
    return Uint8Array.from(data);
  };

  const handleViewAttachment = async (path: string) => {
    if (!path) return;
    const type = path.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
    if (isMockMode()) {
      setPreview({ url: '', name: downloadAttachmentFilename(path), type, mock: true });
      return;
    }
    try {
      const bytes = await ReadIncomeAttachment(path);
      const mime = mimeTypeForPath(path);
      const url = URL.createObjectURL(new Blob([toUint8Array(bytes)], { type: mime }));
      setPreview({ url, name: downloadAttachmentFilename(path), type: mime === 'application/pdf' ? 'pdf' : 'image' });
    } catch (err) {
      console.error('Failed to view attachment:', err);
    }
  };

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const handleDownloadAttachment = async (path: string) => {
    if (!path) return;
    if (isMockMode()) {
      console.log('Mock mode: no real file backs this attachment path yet —', path);
      return;
    }
    try {
      const bytes = await ReadIncomeAttachment(path);
      const url = URL.createObjectURL(new Blob([toUint8Array(bytes)], { type: mimeTypeForPath(path) }));
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadAttachmentFilename(path);
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download attachment:', err);
    }
  };

  return (
    <div style={accentVars}>
      <IncomeOverview
        theme={theme}
        accent={accent}
        currency={currency}
        streams={streams}
        entries={entries}
        onOpenAddStream={() => setModalOpen(true)}
        onEditStream={handleEditStream}
        onSubmitEntry={handleSubmitEntry}
        onAddAttachment={handleAddAttachment}
        onViewAttachment={handleViewAttachment}
        onDownloadAttachment={handleDownloadAttachment}
        onDeleteAttachment={handleDeleteAttachment}
        onDeleteEntry={handleDeleteEntry}
      />

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
                {editingStreamId ? 'Edit Income Stream' : 'Add Income Stream'}
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
                    Source Type
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

              {streamError && <p className="text-[12px] font-medium text-red-400">{streamError}</p>}
            </div>

            <div className="flex justify-between items-center gap-2 mt-7">
              {editingStreamId ? (
                <button
                  onClick={() => {
                    const stream = streams.find((s) => s.id === editingStreamId);
                    if (!stream) return;
                    setDeleteStreamError('');
                    setDeleteStreamTarget({ id: stream.id, name: stream.name });
                  }}
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
                  disabled={!newStreamName.trim() || creatingStream}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]"
                >
                  {creatingStream ? (editingStreamId ? 'Saving…' : 'Adding…') : editingStreamId ? 'Save Changes' : 'Add Stream'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Income Stream Confirmation */}
      {deleteStreamTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !deletingStream && setDeleteStreamTarget(null)} />
          <div
            className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 ${
              theme === 'dark' ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
            }`}
          >
            <h2 className={`text-[15px] font-semibold tracking-tight mb-4 ${theme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
              Delete Income Stream
            </h2>
            <p className={`text-[13px] ${theme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'}`}>
              Are you sure you want to delete {deleteStreamTarget.name}? Every income entry and attachment recorded against it will be permanently removed. This can&apos;t be undone.
            </p>
            {deleteStreamError && (
              <p className={`mt-3 text-[12px] ${theme === 'dark' ? 'text-[#f87171]' : 'text-[#dc2626]'}`}>{deleteStreamError}</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteStreamTarget(null)}
                disabled={deletingStream}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  theme === 'dark' ? 'text-[#c7c4d7] hover:bg-[#201f1f]' : 'text-[#464554] hover:bg-[#eff4ff]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStream}
                disabled={deletingStream}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600"
              >
                {deletingStream ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={closePreview} />
          <div
            className={`relative w-full max-w-3xl rounded-2xl shadow-2xl p-6 ${
              theme === 'dark' ? 'bg-[#1a1a1a] border border-[#353534]' : 'bg-white border border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2
                className={`text-[15px] font-semibold tracking-tight truncate ${
                  theme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'
                }`}
              >
                {preview.name}
              </h2>
              <button
                onClick={closePreview}
                className={`p-1.5 rounded-md shrink-0 transition-colors ${
                  theme === 'dark'
                    ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                    : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {preview.mock ? (
              <p className={`text-[13px] py-12 text-center ${theme === 'dark' ? 'text-[#8e8ca0]' : 'text-[#767586]'}`}>
                No real file backs this attachment in mock mode.
              </p>
            ) : preview.type === 'pdf' ? (
              <iframe src={preview.url} title={preview.name} className="w-full h-[75vh] rounded-lg border-0" />
            ) : (
              <img
                src={preview.url}
                alt={preview.name}
                className="max-w-full max-h-[75vh] mx-auto rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
