import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OpenWAStatus, CampaignStatus, Template } from '../types';
import { formatPhoneDisplay } from '../utils';

interface Props {
  openwa: OpenWAStatus | null;
  campaign: CampaignStatus | null;
}

export function Campaign({ openwa, campaign }: Props) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [useArabic, setUseArabic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [liveStats, setLiveStats] = useState(campaign?.stats ?? null);

  useEffect(() => {
    window.api.getTemplates().then((tpls) => {
      setTemplates(tpls);
      if (tpls.length > 0) setTemplateId(tpls[0].id);
    });
    // Stats fraîches à l'ouverture de la page (après un import par ex.)
    window.api.getCampaignStatus().then((s) => setLiveStats(s.stats));
  }, []);

  useEffect(() => {
    if (campaign?.stats) setLiveStats(campaign.stats);
  }, [campaign?.stats]);

  const connected = openwa?.sessionStatus === 'CONNECTED';
  const running = campaign?.running;
  const paused = campaign?.paused;
  const stats = liveStats;

  const dailyPct = stats ? Math.min(100, (stats.sentToday / stats.dailyLimit) * 100) : 0;
  const sentPct = stats && stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;

  const handleStart = async () => {
    setError(null);
    if (!connected) {
      setError(t('campaign.notConnected'));
      return;
    }
    if (!templateId) {
      setError(t('campaign.noTemplate'));
      return;
    }
    // Vérifie l'état réel (pas les stats potentiellement périmées de l'UI)
    const fresh = await window.api.getCampaignStatus();
    setLiveStats(fresh.stats);
    if (fresh.stats.pending === 0) {
      setError(t('campaign.noPending'));
      return;
    }
    try {
      await window.api.startCampaign(templateId, useArabic);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">{t('campaign.title')}</h1>
      <p className="mb-6 text-slate-500">{t('campaign.limitInfo')}</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              {t('campaign.selectTemplate')}
            </label>
            <select
              value={templateId ?? ''}
              onChange={(e) => setTemplateId(Number(e.target.value))}
              disabled={running}
              className="mb-4 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-wa-green focus:outline-none disabled:bg-slate-50"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>

            <label className="mb-2 block text-sm font-medium text-slate-600">
              {t('campaign.language')}
            </label>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setUseArabic(false)}
                disabled={running}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  !useArabic ? 'border-wa-green bg-green-50 text-wa-teal' : 'border-slate-200 text-slate-500'
                }`}
              >
                🇫🇷 {t('campaign.fr')}
              </button>
              <button
                onClick={() => setUseArabic(true)}
                disabled={running}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  useArabic ? 'border-wa-green bg-green-50 text-wa-teal' : 'border-slate-200 text-slate-500'
                }`}
              >
                🇲🇦 {t('campaign.ar')}
              </button>
            </div>

            {templateId && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <p dir={useArabic ? 'rtl' : 'ltr'} className="whitespace-pre-wrap">
                  {useArabic
                    ? templates.find((x) => x.id === templateId)?.contentAr
                    : templates.find((x) => x.id === templateId)?.contentFr}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            {!running ? (
              <button
                onClick={handleStart}
                className="w-full rounded-lg bg-wa-green px-6 py-4 text-lg font-bold text-white shadow-md hover:bg-wa-teal"
              >
                🚀 {t('campaign.start')}
              </button>
            ) : (
              <div className="flex gap-3">
                {paused ? (
                  <button
                    onClick={() => window.api.resumeCampaign()}
                    className="flex-1 rounded-lg bg-wa-green px-4 py-3 font-semibold text-white hover:bg-wa-teal"
                  >
                    ▶️ {t('campaign.resume')}
                  </button>
                ) : (
                  <button
                    onClick={() => window.api.pauseCampaign()}
                    className="flex-1 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600"
                  >
                    ⏸️ {t('campaign.pause')}
                  </button>
                )}
                <button
                  onClick={() => window.api.stopCampaign()}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600"
                >
                  ⏹️ {t('campaign.stop')}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            {(running || campaign?.message) && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      running && !paused ? 'animate-pulse bg-green-500' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {running ? (paused ? t('campaign.paused') : t('campaign.running')) : t('campaign.idle')}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{campaign?.message}</p>
                {campaign?.currentPhone && (
                  <p className="mt-1 font-mono text-xs text-wa-teal">
                    {t('campaign.currentlySending')}: {formatPhoneDisplay(campaign.currentPhone)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{t('campaign.progress')}</h3>
            <ProgressBar label={t('contacts.sent')} value={stats?.sent ?? 0} total={stats?.total ?? 0} pct={sentPct} color="bg-wa-green" />
            <div className="mt-4 space-y-2 text-sm">
              <Row label={t('contacts.total')} value={stats?.total ?? 0} />
              <Row label={t('contacts.pending')} value={stats?.pending ?? 0} color="text-amber-600" />
              <Row label={t('contacts.sent')} value={stats?.sent ?? 0} color="text-green-600" />
              <Row label={t('contacts.failed')} value={stats?.failed ?? 0} color="text-red-600" />
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{t('campaign.dailyLimit')}</h3>
            <ProgressBar
              label={t('campaign.sentToday')}
              value={stats?.sentToday ?? 0}
              total={stats?.dailyLimit ?? 0}
              pct={dailyPct}
              color={dailyPct > 90 ? 'bg-red-500' : 'bg-wa-teal'}
            />
            <p className="mt-2 text-xs text-slate-400">
              {stats?.sentToday ?? 0} / {stats?.dailyLimit ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  total,
  pct,
  color,
}: {
  label: string;
  value: number;
  total: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>
          {value}/{total}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color || 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
