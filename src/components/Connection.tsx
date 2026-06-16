import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OpenWAStatus } from '../types';

interface Props {
  openwa: OpenWAStatus | null;
}

export function Connection({ openwa }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const connected = openwa?.sessionStatus === 'CONNECTED';

  useEffect(() => {
    if (openwa?.serverReady && !openwa.sessionId && !busy) {
      handleConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openwa?.serverReady]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await window.api.createSession();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">{t('connection.title')}</h1>
      <p className="mb-6 text-slate-500">{t('connection.subtitle')}</p>

      {connected ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✅
          </div>
          <h2 className="text-xl font-bold text-green-600">{t('status.connected')}</h2>
          {openwa?.phoneNumber && (
            <p className="mt-2 text-slate-600">
              {t('connection.connectedAs')}: <strong>+{openwa.phoneNumber}</strong>
            </p>
          )}
          <button
            onClick={async () => {
              if (confirm(t('connection.logoutConfirm'))) {
                setBusy(true);
                try {
                  await window.api.logoutWhatsApp();
                } finally {
                  setBusy(false);
                }
              }
            }}
            disabled={busy}
            className="mt-6 rounded-lg bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            🔌 {t('connection.logout')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-700">📱 Instructions</h3>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-bold text-wa-teal">1.</span>{t('connection.step1')}</li>
              <li className="flex gap-2"><span className="font-bold text-wa-teal">2.</span>{t('connection.step2')}</li>
              <li className="flex gap-2"><span className="font-bold text-wa-teal">3.</span>{t('connection.step3')}</li>
              <li className="flex gap-2"><span className="font-bold text-wa-teal">4.</span>{t('connection.step4')}</li>
            </ol>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm">
            {!openwa?.serverReady ? (
              <div className="text-center text-slate-500">
                <div className="mb-3 inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-wa-green" />
                <p className="text-sm">{openwa?.setupProgress || t('connection.serverStarting')}</p>
              </div>
            ) : openwa?.qrImage ? (
              <>
                <img
                  src={openwa.qrImage}
                  alt="QR"
                  className="h-64 w-64 rounded-lg border-4 border-wa-green p-1"
                />
                <button
                  onClick={handleConnect}
                  className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  🔄 {t('connection.refresh')}
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-3 inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-wa-green" />
                <p className="text-sm text-slate-500">{t('connection.waiting')}</p>
                <button
                  onClick={handleConnect}
                  disabled={busy}
                  className="mt-4 rounded-lg bg-wa-green px-5 py-2 text-sm font-semibold text-white hover:bg-wa-teal disabled:opacity-50"
                >
                  {t('connection.connectBtn')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {openwa?.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {openwa.error}
        </div>
      )}
    </div>
  );
}
