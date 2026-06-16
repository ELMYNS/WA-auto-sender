// Types partagés côté Electron (copie autonome pour rester dans le rootDir electron).
export interface AppSettings {
  language: 'fr' | 'ar';
  minIntervalSec: number;
  maxIntervalSec: number;
  dailyLimit: number;
  batchSize: number;
  batchPauseSec: number;
  cooldownEvery: number;
  cooldownSec: number;
  workingHoursEnabled: boolean;
  workStartHour: number;
  workEndHour: number;
  skipWeekends: boolean;
  randomizeMessage: boolean;
  typingDelayMs: number;
  openwaPort: number;
  sessionName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'fr',
  minIntervalSec: 45,
  maxIntervalSec: 120,
  dailyLimit: 80,
  batchSize: 10,
  batchPauseSec: 300,
  cooldownEvery: 15,
  cooldownSec: 180,
  workingHoursEnabled: true,
  workStartHour: 9,
  workEndHour: 20,
  skipWeekends: true,
  randomizeMessage: true,
  typingDelayMs: 2000,
  openwaPort: 2785,
  sessionName: 'wa-auto-sender',
};

export interface Contact {
  id: number;
  phone: string;
  name: string | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sentAt: string | null;
  error: string | null;
  source: string | null;
  createdAt: string;
}

export interface Template {
  id: number;
  name: string;
  contentFr: string;
  contentAr: string;
  category: string;
}

export interface CampaignStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
  sentToday: number;
  dailyLimit: number;
}

export interface CampaignStatus {
  running: boolean;
  paused: boolean;
  currentPhone: string | null;
  progress: number;
  message: string;
  stats: CampaignStats;
}

export interface OpenWAStatus {
  serverRunning: boolean;
  serverReady: boolean;
  apiKey: string | null;
  sessionId: string | null;
  sessionStatus: string | null;
  phoneNumber: string | null;
  qrImage: string | null;
  setupProgress: string | null;
  error: string | null;
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  phones: string[];
}

export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  getOpenWAStatus: () => Promise<OpenWAStatus>;
  startOpenWA: () => Promise<OpenWAStatus>;
  createSession: () => Promise<OpenWAStatus>;
  refreshQR: () => Promise<OpenWAStatus>;
  logoutWhatsApp: () => Promise<OpenWAStatus>;
  resetApp: () => Promise<OpenWAStatus>;
  importFile: () => Promise<ImportResult | null>;
  importText: (text: string) => Promise<ImportResult>;
  getContacts: (filter?: string) => Promise<Contact[]>;
  deleteContact: (id: number) => Promise<void>;
  resetContactStatus: (ids: number[]) => Promise<void>;
  clearContacts: (status?: string) => Promise<void>;
  getTemplates: () => Promise<Template[]>;
  saveTemplate: (template: Omit<Template, 'id'> & { id?: number }) => Promise<Template>;
  deleteTemplate: (id: number) => Promise<void>;
  getCampaignStatus: () => Promise<CampaignStatus>;
  startCampaign: (templateId: number, useArabic: boolean) => Promise<void>;
  pauseCampaign: () => Promise<void>;
  resumeCampaign: () => Promise<void>;
  stopCampaign: () => Promise<void>;
  onCampaignUpdate: (callback: (status: CampaignStatus) => void) => () => void;
  onOpenWAUpdate: (callback: (status: OpenWAStatus) => void) => () => void;
  exportContacts: (status: string) => Promise<string | null>;
}
