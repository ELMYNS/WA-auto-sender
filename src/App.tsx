import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { applyLanguage } from './i18n';
import type { AppSettings, OpenWAStatus, CampaignStatus } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Connection } from './components/Connection';
import { Contacts } from './components/Contacts';
import { Templates } from './components/Templates';
import { Campaign } from './components/Campaign';
import { Settings } from './components/Settings';

export type Page = 'dashboard' | 'connection' | 'contacts' | 'templates' | 'campaign' | 'settings';

export default function App() {
  const { i18n } = useTranslation();
  const [page, setPage] = useState<Page>('dashboard');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [openwa, setOpenwa] = useState<OpenWAStatus | null>(null);
  const [campaign, setCampaign] = useState<CampaignStatus | null>(null);

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettings(s);
      applyLanguage(s.language);
    });
    window.api.getOpenWAStatus().then(setOpenwa);
    window.api.getCampaignStatus().then(setCampaign);

    const off1 = window.api.onOpenWAUpdate(setOpenwa);
    const off2 = window.api.onCampaignUpdate(setCampaign);

    const poll = setInterval(() => {
      window.api.getOpenWAStatus().then(setOpenwa);
      window.api.getCampaignStatus().then(setCampaign);
    }, 3000);

    return () => {
      off1();
      off2();
      clearInterval(poll);
    };
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const updated = await window.api.saveSettings(partial);
    setSettings(updated);
    if (partial.language) applyLanguage(partial.language);
  }, []);

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Chargement...
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-100"
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Sidebar
        page={page}
        setPage={setPage}
        openwa={openwa}
        language={settings.language}
        onToggleLang={() => updateSettings({ language: settings.language === 'fr' ? 'ar' : 'fr' })}
      />
      <main className="flex-1 overflow-y-auto">
        {page === 'dashboard' && (
          <Dashboard openwa={openwa} campaign={campaign} setPage={setPage} />
        )}
        {page === 'connection' && <Connection openwa={openwa} />}
        {page === 'contacts' && <Contacts />}
        {page === 'templates' && <Templates />}
        {page === 'campaign' && (
          <Campaign openwa={openwa} campaign={campaign} />
        )}
        {page === 'settings' && (
          <Settings settings={settings} onUpdate={updateSettings} />
        )}
      </main>
    </div>
  );
}
