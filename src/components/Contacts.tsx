import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Contact } from '../types';
import { formatPhoneDisplay } from '../utils';

const FILTERS = ['all', 'pending', 'sent', 'failed', 'skipped'] as const;

export function Contacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [pasteText, setPasteText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    window.api.getContacts(filter).then(setContacts);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleImportFile = async () => {
    const result = await window.api.importFile();
    if (result) {
      showToast(t('contacts.importDone', { imported: result.imported, duplicates: result.duplicates }));
      load();
    }
  };

  const handleImportText = async () => {
    if (!pasteText.trim()) return;
    const result = await window.api.importText(pasteText);
    showToast(t('contacts.importDone', { imported: result.imported, duplicates: result.duplicates }));
    setPasteText('');
    load();
  };

  const counts = {
    all: contacts.length,
  };

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">{t('contacts.title')}</h1>
      <p className="mb-6 text-slate-500">{t('contacts.importHint')}</p>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-700">📂 {t('contacts.import')}</h3>
          <button
            onClick={handleImportFile}
            className="w-full rounded-lg border-2 border-dashed border-wa-green bg-green-50 px-4 py-6 text-center font-medium text-wa-teal hover:bg-green-100"
          >
            📎 {t('contacts.import')}
          </button>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-700">✍️ {t('contacts.paste')}</h3>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={t('contacts.pastePlaceholder')}
            className="h-20 w-full resize-none rounded-lg border border-slate-200 p-2 text-sm focus:border-wa-green focus:outline-none"
          />
          <button
            onClick={handleImportText}
            className="mt-2 w-full rounded-lg bg-wa-green px-4 py-2 text-sm font-semibold text-white hover:bg-wa-teal"
          >
            {t('contacts.addBtn')}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-wa-teal text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t(`contacts.${f}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const path = await window.api.exportContacts(filter);
                if (path) showToast('✅ ' + path);
              }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              ⬇️ {t('contacts.export')}
            </button>
            <button
              onClick={async () => {
                if (confirm(t('contacts.confirmClear'))) {
                  await window.api.clearContacts(filter === 'all' ? undefined : filter);
                  load();
                }
              }}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              🗑️ {t('contacts.clear')}
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-440px)] overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="p-8 text-center text-slate-400">{t('contacts.empty')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">{t('contacts.phone')}</th>
                  <th className="px-4 py-2">{t('contacts.statusCol')}</th>
                  <th className="px-4 py-2">{t('contacts.source')}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-slate-700">{formatPhoneDisplay(c.phone)}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={c.status} label={t(`contacts.${c.status}`)} />
                      {c.error && <span className="ml-2 text-xs text-red-400">{c.error}</span>}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400">{c.source}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={async () => {
                          await window.api.deleteContact(c.id);
                          load();
                        }}
                        className="text-slate-300 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-slate-800 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    skipped: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || colors.pending}`}>
      {label}
    </span>
  );
}
