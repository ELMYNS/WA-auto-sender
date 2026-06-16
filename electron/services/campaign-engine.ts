import type { AppDatabase } from './database';
import type { WhatsAppClient } from './whatsapp-client';
import type { CampaignStatus } from '../shared';
import { toChatId } from './number-parser';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function personalizeMessage(template: string, contact: { phone: string; name?: string | null }): string {
  const variations = [
    template,
    template.replace(/^Bonjour/g, 'Salam'),
    template.replace(/^السلام عليكم/g, 'مرحبا'),
  ];
  let msg = variations[Math.floor(Math.random() * variations.length)];
  msg = msg.replace(/\{name\}/gi, contact.name || '');
  msg = msg.replace(/\{phone\}/gi, contact.phone);
  msg = msg.replace(/\{date\}/gi, new Date().toLocaleDateString('fr-MA'));
  return msg.trim();
}

export class CampaignEngine {
  private running = false;
  private paused = false;
  private stopRequested = false;
  private currentPhone: string | null = null;
  private message = '';
  private sentInBatch = 0;
  private sentSinceCooldown = 0;
  private onUpdate?: (status: CampaignStatus) => void;

  constructor(
    private db: AppDatabase,
    private openwa: WhatsAppClient
  ) {}

  setUpdateCallback(cb: (status: CampaignStatus) => void) {
    this.onUpdate = cb;
  }

  private emit() {
    const settings = this.db.getSettings();
    this.onUpdate?.({
      running: this.running,
      paused: this.paused,
      currentPhone: this.currentPhone,
      progress: 0,
      message: this.message,
      stats: this.db.getStats(settings.dailyLimit),
    });
  }

  private isWithinWorkingHours(settings: ReturnType<AppDatabase['getSettings']>): boolean {
    if (!settings.workingHoursEnabled) return true;
    const now = new Date();
    if (settings.skipWeekends && (now.getDay() === 0 || now.getDay() === 6)) return false;
    const hour = now.getHours();
    return hour >= settings.workStartHour && hour < settings.workEndHour;
  }

  async start(templateId: number, useArabic: boolean) {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.stopRequested = false;
    this.sentInBatch = 0;
    this.sentSinceCooldown = 0;

    const settings = this.db.getSettings();
    const templates = this.db.getTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      this.message = 'Modèle introuvable';
      this.running = false;
      this.emit();
      return;
    }

    this.message = useArabic ? 'حملة بدأت...' : 'Campagne démarrée...';
    this.emit();

    while (!this.stopRequested) {
      if (this.paused) {
        await sleep(1000);
        continue;
      }

      if (!this.isWithinWorkingHours(settings)) {
        this.message = useArabic
          ? 'خارج ساعات العمل - انتظار...'
          : 'Hors heures de travail - en attente...';
        this.emit();
        await sleep(60000);
        continue;
      }

      const sentToday = this.db.getSentTodayCount();
      if (sentToday >= settings.dailyLimit) {
        this.message = useArabic
          ? `تم الوصول للحد اليومي (${settings.dailyLimit})`
          : `Limite journalière atteinte (${settings.dailyLimit})`;
        this.emit();
        break;
      }

      const pending = this.db.getPendingContacts();
      if (pending.length === 0) {
        this.message = useArabic ? 'اكتملت الحملة !' : 'Campagne terminée !';
        break;
      }

      const contact = pending[0];
      this.currentPhone = contact.phone;
      this.message = useArabic
        ? `إرسال إلى ${contact.phone}...`
        : `Envoi vers ${contact.phone}...`;
      this.emit();

      try {
        const baseText = useArabic ? template.contentAr : template.contentFr;
        const text = settings.randomizeMessage
          ? personalizeMessage(baseText, contact)
          : baseText.replace(/\{name\}/gi, contact.name || '').replace(/\{phone\}/gi, contact.phone);

        const chatId = toChatId(contact.phone);

        // Humanized typing delay
        await sleep(settings.typingDelayMs + randomBetween(500, 2000));

        const exists = await this.openwa.checkNumber(contact.phone);
        if (!exists) {
          this.db.markContactFailed(contact.id, contact.phone, 'Numéro non WhatsApp', templateId);
          this.message = useArabic ? 'رقم غير مسجل' : 'Numéro non enregistré sur WhatsApp';
        } else {
          await this.openwa.sendText(chatId, text);
          this.db.markContactSent(contact.id, contact.phone, templateId, text);
          this.sentInBatch++;
          this.sentSinceCooldown++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.db.markContactFailed(contact.id, contact.phone, errMsg, templateId);
        this.message = `Erreur: ${errMsg}`;

        if (errMsg.includes('banned') || errMsg.includes('BANNED')) {
          this.message = useArabic ? '⚠️ حساب محظور - توقف' : '⚠️ Compte banni - arrêt';
          break;
        }
      }

      this.emit();

      // Batch pause
      if (this.sentInBatch >= settings.batchSize) {
        this.message = useArabic
          ? `استراحة بين الدفعات (${settings.batchPauseSec}s)...`
          : `Pause entre lots (${settings.batchPauseSec}s)...`;
        this.emit();
        await sleep(settings.batchPauseSec * 1000);
        this.sentInBatch = 0;
      }

      // Cooldown
      if (this.sentSinceCooldown >= settings.cooldownEvery) {
        this.message = useArabic
          ? `تبريد أمان (${settings.cooldownSec}s)...`
          : `Pause anti-ban (${settings.cooldownSec}s)...`;
        this.emit();
        await sleep(settings.cooldownSec * 1000);
        this.sentSinceCooldown = 0;
      }

      // Humanized interval between messages
      const delaySec = randomBetween(settings.minIntervalSec, settings.maxIntervalSec);
      this.message = useArabic
        ? `انتظار ${delaySec}s قبل الرسالة التالية...`
        : `Attente ${delaySec}s avant le prochain message...`;
      this.emit();
      await sleep(delaySec * 1000);
    }

    this.running = false;
    this.paused = false;
    this.currentPhone = null;
    this.emit();
  }

  pause() {
    this.paused = true;
    this.emit();
  }

  resume() {
    this.paused = false;
    this.emit();
  }

  stop() {
    this.stopRequested = true;
    this.running = false;
    this.paused = false;
    this.emit();
  }

  getStatus(): CampaignStatus {
    const settings = this.db.getSettings();
    return {
      running: this.running,
      paused: this.paused,
      currentPhone: this.currentPhone,
      progress: 0,
      message: this.message,
      stats: this.db.getStats(settings.dailyLimit),
    };
  }
}
