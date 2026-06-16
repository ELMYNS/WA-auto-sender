import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>;
}

export function Settings({ settings, onUpdate }: Props) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocal({ ...local, [key]: value });
  };

  const handleSave = async () => {
    await onUpdate(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{t('settings.title')}</h1>

      <div className="grid grid-cols-2 gap-6">
        <Section title="🌍 " label={t('settings.language')}>
          <div className="flex gap-2">
            <LangBtn active={local.language === 'fr'} onClick={() => set('language', 'fr')} label="🇫🇷 Français" />
            <LangBtn active={local.language === 'ar'} onClick={() => set('language', 'ar')} label="🇲🇦 العربية" />
          </div>
        </Section>

        <Section title="📊 " label={t('settings.dailyLimit')}>
          <NumberInput value={local.dailyLimit} onChange={(v) => set('dailyLimit', v)} min={1} max={1000} />
          <p className="mt-1 text-xs text-slate-400">{t('settings.dailyLimitHint')}</p>
        </Section>

        <Section title="⏱️ " label={t('settings.sendingPace')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">{t('settings.minInterval')}</label>
              <NumberInput value={local.minIntervalSec} onChange={(v) => set('minIntervalSec', v)} min={5} max={600} />
            </div>
            <div>
              <label className="text-xs text-slate-500">{t('settings.maxInterval')}</label>
              <NumberInput value={local.maxIntervalSec} onChange={(v) => set('maxIntervalSec', v)} min={5} max={600} />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t('settings.intervalHint')}</p>
        </Section>

        <Section title="📦 " label={t('settings.advanced')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">{t('settings.batchSize')}</label>
              <NumberInput value={local.batchSize} onChange={(v) => set('batchSize', v)} min={1} max={100} />
            </div>
            <div>
              <label className="text-xs text-slate-500">{t('settings.batchPause')}</label>
              <NumberInput value={local.batchPauseSec} onChange={(v) => set('batchPauseSec', v)} min={0} max={3600} />
            </div>
            <div>
              <label className="text-xs text-slate-500">{t('settings.cooldownEvery')}</label>
              <NumberInput value={local.cooldownEvery} onChange={(v) => set('cooldownEvery', v)} min={1} max={500} />
            </div>
            <div>
              <label className="text-xs text-slate-500">{t('settings.cooldownSec')}</label>
              <NumberInput value={local.cooldownSec} onChange={(v) => set('cooldownSec', v)} min={0} max={3600} />
            </div>
          </div>
        </Section>

        <Section title="🕐 " label={t('settings.workingHours')}>
          <Toggle
            checked={local.workingHoursEnabled}
            onChange={(v) => set('workingHoursEnabled', v)}
            label={t('settings.workingHoursEnabled')}
          />
          {local.workingHoursEnabled && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">{t('settings.startHour')}</label>
                <NumberInput value={local.workStartHour} onChange={(v) => set('workStartHour', v)} min={0} max={23} />
              </div>
              <div>
                <label className="text-xs text-slate-500">{t('settings.endHour')}</label>
                <NumberInput value={local.workEndHour} onChange={(v) => set('workEndHour', v)} min={0} max={23} />
              </div>
            </div>
          )}
          <div className="mt-3">
            <Toggle
              checked={local.skipWeekends}
              onChange={(v) => set('skipWeekends', v)}
              label={t('settings.skipWeekends')}
            />
          </div>
        </Section>

        <Section title="🎲 " label={t('settings.randomize')}>
          <Toggle
            checked={local.randomizeMessage}
            onChange={(v) => set('randomizeMessage', v)}
            label={t('settings.randomize')}
          />
          <div className="mt-3">
            <label className="text-xs text-slate-500">{t('settings.typingDelay')}</label>
            <NumberInput value={local.typingDelayMs} onChange={(v) => set('typingDelayMs', v)} min={0} max={10000} />
          </div>
        </Section>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded-lg bg-wa-green px-6 py-2.5 font-semibold text-white hover:bg-wa-teal"
        >
          💾 {t('settings.save')}
        </button>
        {saved && <span className="text-sm font-medium text-green-600">✅ {t('settings.saved')}</span>}
      </div>

      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
        <h3 className="mb-1 font-semibold text-red-700">⚠️ {t('settings.dangerZone')}</h3>
        <p className="mb-4 text-sm text-red-600">{t('settings.resetHint')}</p>
        <button
          onClick={async () => {
            if (confirm(t('settings.resetConfirm'))) {
              await window.api.resetApp();
              alert(t('settings.resetDone'));
            }
          }}
          className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
        >
          🗑️ {t('settings.resetApp')}
        </button>
      </div>
    </div>
  );
}

function Section({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-700">
        {title}
        {label}
      </h3>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-wa-green focus:outline-none"
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-wa-green' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
      <span className="text-sm text-slate-600">{label}</span>
    </label>
  );
}

function LangBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
        active ? 'border-wa-green bg-green-50 text-wa-teal' : 'border-slate-200 text-slate-500'
      }`}
    >
      {label}
    </button>
  );
}
