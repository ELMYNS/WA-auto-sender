import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Template } from '../types';

const emptyTemplate: Omit<Template, 'id'> = {
  name: '',
  contentFr: '',
  contentAr: '',
  category: 'business',
};

const CATEGORIES = ['business', 'promotion', 'reminder', 'product', 'followup'];

export function Templates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<(Omit<Template, 'id'> & { id?: number }) | null>(null);

  const load = () => window.api.getTemplates().then(setTemplates);
  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) return;
    await window.api.saveTemplate(editing);
    setEditing(null);
    load();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('templates.title')}</h1>
        </div>
        <button
          onClick={() => setEditing({ ...emptyTemplate })}
          className="rounded-lg bg-wa-green px-4 py-2 text-sm font-semibold text-white hover:bg-wa-teal"
        >
          ➕ {t('templates.new')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{tpl.name}</h3>
              <span className="rounded-full bg-wa-light px-2 py-0.5 text-xs text-wa-dark">
                {t(`templates.categories.${tpl.category}`)}
              </span>
            </div>
            <p className="mb-1 whitespace-pre-wrap text-xs text-slate-500">🇫🇷 {tpl.contentFr.slice(0, 100)}</p>
            <p dir="rtl" className="mb-3 whitespace-pre-wrap text-xs text-slate-500">🇲🇦 {tpl.contentAr.slice(0, 100)}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(tpl)}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                ✏️ {t('templates.edit')}
              </button>
              <button
                onClick={async () => {
                  await window.api.deleteTemplate(tpl.id);
                  load();
                }}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                🗑️ {t('templates.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {editing.id ? t('templates.edit') : t('templates.new')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  {t('templates.name')}
                </label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-wa-green focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  {t('templates.category')}
                </label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-wa-green focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`templates.categories.${c}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    {t('templates.fr')}
                  </label>
                  <textarea
                    value={editing.contentFr}
                    onChange={(e) => setEditing({ ...editing, contentFr: e.target.value })}
                    className="h-32 w-full resize-none rounded-lg border border-slate-200 p-2 text-sm focus:border-wa-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    {t('templates.ar')}
                  </label>
                  <textarea
                    dir="rtl"
                    value={editing.contentAr}
                    onChange={(e) => setEditing({ ...editing, contentAr: e.target.value })}
                    className="h-32 w-full resize-none rounded-lg border border-slate-200 p-2 text-sm focus:border-wa-green focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">{t('templates.variables')}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                {t('templates.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-wa-green px-4 py-2 text-sm font-semibold text-white hover:bg-wa-teal"
              >
                {t('templates.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
