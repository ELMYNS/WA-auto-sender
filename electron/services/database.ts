import path from 'path';
import fs from 'fs';
import type { AppSettings, Contact, Template, CampaignStats } from '../shared';
import { DEFAULT_SETTINGS } from '../shared';

interface SendLogEntry {
  phone: string;
  templateId: number;
  status: string;
  message: string;
  sentAt: string;
}

interface DataShape {
  settings: Record<string, unknown>;
  contacts: Contact[];
  templates: Template[];
  sendLog: SendLogEntry[];
  nextContactId: number;
  nextTemplateId: number;
}

/**
 * Stockage 100% JavaScript (aucun module natif à compiler).
 * Persiste les données dans un fichier JSON avec écriture debouncée.
 */
export class AppDatabase {
  private file: string;
  private data: DataShape;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.file = path.join(dataDir, 'wa-auto-sender.json');
    this.data = this.load();
    this.seedTemplates();
  }

  private load(): DataShape {
    if (fs.existsSync(this.file)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.file, 'utf-8'));
        return {
          settings: parsed.settings || {},
          contacts: parsed.contacts || [],
          templates: parsed.templates || [],
          sendLog: parsed.sendLog || [],
          nextContactId: parsed.nextContactId || 1,
          nextTemplateId: parsed.nextTemplateId || 1,
        };
      } catch {
        /* corrupt file - start fresh */
      }
    }
    return {
      settings: {},
      contacts: [],
      templates: [],
      sendLog: [],
      nextContactId: 1,
      nextTemplateId: 1,
    };
  }

  private persist() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flush(), 300);
  }

  private flush() {
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data), 'utf-8');
    fs.renameSync(tmp, this.file);
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private seedTemplates() {
    if (this.data.templates.length > 0) return;

    const templates = [
      {
        name: 'Promotion générale',
        contentFr: 'Bonjour ! 🌟\n\nNous avons une offre spéciale pour vous. Contactez-nous pour plus de détails.\n\nMerci !',
        contentAr: 'السلام عليكم ! 🌟\n\nلدينا عرض خاص لكم. تواصلوا معنا لمزيد من التفاصيل.\n\nشكراً !',
        category: 'promotion',
      },
      {
        name: 'Rappel rendez-vous',
        contentFr: 'Bonjour,\n\nCeci est un rappel pour votre rendez-vous. Merci de confirmer votre présence.\n\nCordialement.',
        contentAr: 'السلام عليكم،\n\nهذا تذكير بموعدكم. يرجى تأكيد حضوركم.\n\nمع التحية.',
        category: 'reminder',
      },
      {
        name: 'Nouveau produit',
        contentFr: 'Bonjour ! 🎉\n\nDécouvrez notre nouveau produit/service. Nous serions ravis de vous en parler.\n\nÀ bientôt !',
        contentAr: 'السلام عليكم ! 🎉\n\nاكتشفوا منتجنا/خدمتنا الجديدة. يسعدنا التحدث معكم.\n\nإلى اللقاء !',
        category: 'product',
      },
      {
        name: 'Suivi client',
        contentFr: 'Bonjour,\n\nNous espérons que tout va bien. Avez-vous des questions ? Nous sommes à votre disposition.\n\nBonne journée !',
        contentAr: 'السلام عليكم،\n\nنأمل أن تكونوا بخير. هل لديكم أسئلة؟ نحن في خدمتكم.\n\nيوم سعيد !',
        category: 'followup',
      },
      {
        name: 'Offre limitée',
        contentFr: "⏰ Offre limitée !\n\nProfitez de notre promotion avant qu'elle ne se termine. Contactez-nous maintenant !",
        contentAr: '⏰ عرض محدود !\n\nاستفيدوا من عرضنا قبل انتهائه. تواصلوا معنا الآن !',
        category: 'promotion',
      },
    ];

    for (const t of templates) {
      this.data.templates.push({ id: this.data.nextTemplateId++, ...t });
    }
    this.persist();
  }

  getSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...this.data.settings } as AppSettings;
  }

  saveSettings(partial: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...partial };
    this.persist();
    return this.getSettings();
  }

  importContacts(phones: string[], source: string): { imported: number; duplicates: number } {
    let imported = 0;
    let duplicates = 0;
    const existing = new Set(this.data.contacts.map((c) => c.phone));
    const now = new Date().toISOString();

    for (const phone of phones) {
      if (existing.has(phone)) {
        duplicates++;
        continue;
      }
      existing.add(phone);
      this.data.contacts.push({
        id: this.data.nextContactId++,
        phone,
        name: null,
        status: 'pending',
        sentAt: null,
        error: null,
        source,
        createdAt: now,
      });
      imported++;
    }
    this.persist();
    return { imported, duplicates };
  }

  getContacts(filter?: string): Contact[] {
    let list = this.data.contacts;
    if (filter && filter !== 'all') {
      list = list.filter((c) => c.status === filter);
    }
    return [...list].sort((a, b) => b.id - a.id);
  }

  deleteContact(id: number) {
    this.data.contacts = this.data.contacts.filter((c) => c.id !== id);
    this.persist();
  }

  resetContactStatus(ids: number[]) {
    const idSet = new Set(ids);
    for (const c of this.data.contacts) {
      if (idSet.has(c.id)) {
        c.status = 'pending';
        c.sentAt = null;
        c.error = null;
      }
    }
    this.persist();
  }

  clearContacts(status?: string) {
    if (status && status !== 'all') {
      this.data.contacts = this.data.contacts.filter((c) => c.status !== status);
    } else {
      this.data.contacts = [];
    }
    this.persist();
  }

  getPendingContacts(): Contact[] {
    return this.data.contacts
      .filter((c) => c.status === 'pending')
      .sort((a, b) => a.id - b.id);
  }

  markContactSent(id: number, phone: string, templateId: number, message: string) {
    const c = this.data.contacts.find((x) => x.id === id);
    if (c) {
      c.status = 'sent';
      c.sentAt = new Date().toISOString();
      c.error = null;
    }
    this.data.sendLog.push({
      phone,
      templateId,
      status: 'sent',
      message,
      sentAt: new Date().toISOString(),
    });
    this.persist();
  }

  markContactFailed(id: number, phone: string, error: string, templateId: number) {
    const c = this.data.contacts.find((x) => x.id === id);
    if (c) {
      c.status = 'failed';
      c.error = error;
    }
    this.data.sendLog.push({
      phone,
      templateId,
      status: 'failed',
      message: error,
      sentAt: new Date().toISOString(),
    });
    this.persist();
  }

  getSentTodayCount(): number {
    const today = this.todayStr();
    return this.data.sendLog.filter(
      (l) => l.status === 'sent' && l.sentAt.slice(0, 10) === today
    ).length;
  }

  getStats(dailyLimit: number): CampaignStats {
    const stats: CampaignStats = {
      total: this.data.contacts.length,
      pending: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      sentToday: this.getSentTodayCount(),
      dailyLimit,
    };
    for (const c of this.data.contacts) {
      if (c.status in stats) {
        (stats as unknown as Record<string, number>)[c.status]++;
      }
    }
    return stats;
  }

  getTemplates(): Template[] {
    return [...this.data.templates].sort((a, b) => a.id - b.id);
  }

  saveTemplate(template: Omit<Template, 'id'> & { id?: number }): Template {
    if (template.id) {
      const existing = this.data.templates.find((t) => t.id === template.id);
      if (existing) {
        existing.name = template.name;
        existing.contentFr = template.contentFr;
        existing.contentAr = template.contentAr;
        existing.category = template.category;
      }
      this.persist();
      return existing || ({ ...template, id: template.id } as Template);
    }
    const created: Template = { ...template, id: this.data.nextTemplateId++ } as Template;
    this.data.templates.push(created);
    this.persist();
    return created;
  }

  deleteTemplate(id: number) {
    this.data.templates = this.data.templates.filter((t) => t.id !== id);
    this.persist();
  }

  exportContacts(status: string): string {
    return this.getContacts(status === 'all' ? undefined : status)
      .map((c) => c.phone)
      .join('\n');
  }

  close() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.flush();
  }
}
