import { useTranslation } from 'react-i18next';
import type { OpenWAStatus } from '../types';
import type { Page } from '../App';

interface Props {
  page: Page;
  setPage: (p: Page) => void;
  openwa: OpenWAStatus | null;
  language: 'fr' | 'ar';
  onToggleLang: () => void;
}

const navItems: { id: Page; icon: string }[] = [
  { id: 'dashboard', icon: '📊' },
  { id: 'connection', icon: '🔗' },
  { id: 'contacts', icon: '👥' },
  { id: 'templates', icon: '📝' },
  { id: 'campaign', icon: '🚀' },
  { id: 'settings', icon: '⚙️' },
];

export function Sidebar({ page, setPage, openwa, language, onToggleLang }: Props) {
  const { t } = useTranslation();

  const connected = openwa?.sessionStatus === 'CONNECTED';
  const statusColor = connected
    ? 'text-green-500'
    : openwa?.serverReady
    ? 'text-amber-500'
    : 'text-slate-400';
  const statusLabel = connected
    ? t('status.connected')
    : openwa?.sessionStatus === 'SCAN_QR'
    ? t('status.scanQr')
    : openwa?.serverReady
    ? t('status.ready')
    : t('status.starting');

  return (
    <aside className="flex w-64 flex-col bg-wa-dark text-white shadow-xl">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-wa-green text-2xl shadow-lg">
          💬
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">{t('appName')}</h1>
          <p className="text-[11px] text-white/60">{t('tagline')}</p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
        <span className={`relative flex h-2.5 w-2.5 ${statusColor}`}>
          <span className="pulse-dot" />
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
        <span className="text-xs font-medium">{statusLabel}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              page === item.id
                ? 'bg-wa-green text-white shadow-md'
                : 'text-white/75 hover:bg-white/10'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {t(`nav.${item.id}`)}
          </button>
        ))}
      </nav>

      <div className="p-3">
        <button
          onClick={onToggleLang}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-semibold hover:bg-white/20"
        >
          {language === 'fr' ? '🇲🇦 العربية' : '🇫🇷 Français'}
        </button>
      </div>
    </aside>
  );
}
