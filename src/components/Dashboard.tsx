import { useTranslation } from 'react-i18next';
import type { OpenWAStatus, CampaignStatus } from '../types';
import type { Page } from '../App';

interface Props {
  openwa: OpenWAStatus | null;
  campaign: CampaignStatus | null;
  setPage: (p: Page) => void;
}

export function Dashboard({ openwa, campaign, setPage }: Props) {
  const { t } = useTranslation();
  const connected = openwa?.sessionStatus === 'CONNECTED';
  const stats = campaign?.stats;

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">{t('dashboard.title')}</h1>
      <p className="mb-6 text-slate-500">{t('tagline')}</p>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.waStatus')}
          value={connected ? t('status.connected') : t('status.disconnected')}
          color={connected ? 'green' : 'slate'}
          icon="🔗"
        />
        <StatCard
          label={t('dashboard.contactsCount')}
          value={String(stats?.total ?? 0)}
          color="blue"
          icon="👥"
        />
        <StatCard
          label={t('dashboard.sentTotal')}
          value={String(stats?.sent ?? 0)}
          color="green"
          icon="✅"
        />
        <StatCard
          label={t('dashboard.pendingCount')}
          value={String(stats?.pending ?? 0)}
          color="amber"
          icon="⏳"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <QuickAction
          icon="🔗"
          title={t('dashboard.step1')}
          btn={t('dashboard.goConnect')}
          done={connected}
          onClick={() => setPage('connection')}
        />
        <QuickAction
          icon="👥"
          title={t('dashboard.step2')}
          btn={t('dashboard.goImport')}
          done={(stats?.total ?? 0) > 0}
          onClick={() => setPage('contacts')}
        />
        <QuickAction
          icon="🚀"
          title={t('dashboard.step3')}
          btn={t('dashboard.goSend')}
          done={(stats?.sent ?? 0) > 0}
          onClick={() => setPage('campaign')}
        />
      </div>

      {openwa?.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {openwa.error}
        </div>
      )}
      {openwa?.setupProgress && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          ⏳ {openwa.setupProgress}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  btn,
  done,
  onClick,
}: {
  icon: string;
  title: string;
  btn: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        {done && <span className="text-green-500">✓</span>}
      </div>
      <p className="mb-4 flex-1 text-sm font-medium text-slate-700">{title}</p>
      <button
        onClick={onClick}
        className="rounded-lg bg-wa-teal px-4 py-2 text-sm font-semibold text-white hover:bg-wa-dark"
      >
        {btn}
      </button>
    </div>
  );
}
