import path from 'path';
import fs from 'fs';
import type { OpenWAStatus } from '../shared';

// whatsapp-web.js et qrcode sont chargés via require (modules CommonJS, sans types).
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore
const { Client, LocalAuth } = require('whatsapp-web.js');
// @ts-ignore
const qrcode = require('qrcode');

/**
 * Moteur WhatsApp intégré (whatsapp-web.js) — le même moteur que celui sur lequel
 * OpenWA est construit, mais exécuté directement dans l'application, sans serveur
 * externe ni téléchargement au premier lancement. Chromium est embarqué.
 */
export class WhatsAppClient {
  private client: any = null;
  private userDataPath: string;
  private resourcesPath: string;
  private appPath: string;
  private status: OpenWAStatus;
  private onStatusChange?: (status: OpenWAStatus) => void;
  private initializing = false;

  constructor(userDataPath: string, resourcesPath: string, appPath: string) {
    this.userDataPath = userDataPath;
    this.resourcesPath = resourcesPath;
    this.appPath = appPath;
    this.status = {
      serverRunning: false,
      serverReady: false,
      apiKey: null,
      sessionId: null,
      sessionStatus: null,
      phoneNumber: null,
      qrImage: null,
      setupProgress: null,
      error: null,
    };
  }

  setStatusCallback(cb: (status: OpenWAStatus) => void) {
    this.onStatusChange = cb;
  }

  getStatus(): OpenWAStatus {
    return { ...this.status };
  }

  private update(partial: Partial<OpenWAStatus>) {
    this.status = { ...this.status, ...partial };
    this.onStatusChange?.(this.getStatus());
  }

  /** Localise le Chromium embarqué (chrome.exe). */
  private findChromium(): string | undefined {
    const bases = [
      path.join(this.resourcesPath, 'chromium'),
      path.join(this.appPath, 'resources', 'chromium'),
      path.join(this.appPath, '..', 'resources', 'chromium'),
    ];
    for (const base of bases) {
      const found = this.searchExecutable(base);
      if (found) return found;
    }
    return undefined;
  }

  private searchExecutable(dir: string, depth = 0): string | undefined {
    if (depth > 6 || !fs.existsSync(dir)) return undefined;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return undefined;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === 'chrome.exe') {
        return full;
      }
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const found = this.searchExecutable(path.join(dir, entry.name), depth + 1);
        if (found) return found;
      }
    }
    return undefined;
  }

  async start(): Promise<void> {
    if (this.client || this.initializing) return;
    this.initializing = true;
    this.update({
      serverRunning: true,
      serverReady: false,
      setupProgress: 'Démarrage du moteur WhatsApp...',
      sessionId: 'wa-session',
      sessionStatus: 'INITIALIZING',
    });

    const executablePath = this.findChromium();
    const sessionPath = path.join(this.userDataPath, 'wa-session');
    fs.mkdirSync(sessionPath, { recursive: true });
    const cachePath = path.join(this.userDataPath, 'wweb-cache');
    fs.mkdirSync(cachePath, { recursive: true });

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionPath }),
      puppeteer: {
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
      webVersionCache: {
        type: 'local',
        path: cachePath,
      },
    });

    this.wireEvents();

    try {
      await this.client.initialize();
      this.update({ serverReady: true, setupProgress: null });
    } catch (err) {
      this.initializing = false;
      this.update({
        serverReady: true,
        setupProgress: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private wireEvents() {
    this.client.on('qr', async (qr: string) => {
      try {
        const image = await qrcode.toDataURL(qr, { margin: 1, width: 320 });
        this.update({
          serverReady: true,
          setupProgress: null,
          sessionStatus: 'SCAN_QR',
          qrImage: image,
          error: null,
        });
      } catch {
        /* ignore */
      }
    });

    this.client.on('loading_screen', (percent: number) => {
      this.update({
        serverReady: true,
        setupProgress: `Chargement WhatsApp... ${percent}%`,
      });
    });

    this.client.on('authenticated', () => {
      this.update({ sessionStatus: 'CONNECTING', qrImage: null, setupProgress: null });
    });

    this.client.on('auth_failure', (msg: string) => {
      this.update({ sessionStatus: 'FAILED', error: `Échec d'authentification: ${msg}` });
    });

    this.client.on('ready', () => {
      this.initializing = false;
      const phone = this.client?.info?.wid?.user || null;
      this.update({
        serverReady: true,
        sessionStatus: 'CONNECTED',
        phoneNumber: phone,
        qrImage: null,
        setupProgress: null,
        error: null,
      });
    });

    this.client.on('disconnected', (reason: string) => {
      this.update({ sessionStatus: 'DISCONNECTED', error: `Déconnecté: ${reason}` });
    });
  }

  /** Force la (re)génération du QR / réinitialise la session. */
  async createSession(): Promise<void> {
    if (!this.client) {
      await this.start();
      return;
    }
    if (this.status.sessionStatus === 'DISCONNECTED' || this.status.sessionStatus === 'FAILED') {
      try {
        await this.client.destroy();
      } catch {
        /* ignore */
      }
      this.client = null;
      this.initializing = false;
      await this.start();
    }
  }

  /** Déconnecte le numéro WhatsApp, efface la session et régénère un nouveau QR. */
  async logout(): Promise<void> {
    this.update({ setupProgress: 'Déconnexion...', sessionStatus: 'INITIALIZING', qrImage: null });
    if (this.client) {
      try {
        await this.client.logout();
      } catch {
        /* déjà déconnecté */
      }
      try {
        await this.client.destroy();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
    this.initializing = false;

    // Supprime le dossier de session (avec quelques tentatives, Windows peut verrouiller)
    const sessionPath = path.join(this.userDataPath, 'wa-session');
    for (let i = 0; i < 5; i++) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    this.update({
      sessionStatus: 'DISCONNECTED',
      phoneNumber: null,
      qrImage: null,
      error: null,
    });

    // Redémarre pour obtenir un nouveau QR
    await this.start();
  }

  async sendText(chatId: string, text: string): Promise<void> {
    if (!this.client || this.status.sessionStatus !== 'CONNECTED') {
      throw new Error('WhatsApp non connecté');
    }
    await this.client.sendMessage(chatId, text);
  }

  async checkNumber(phone: string): Promise<boolean> {
    if (!this.client || this.status.sessionStatus !== 'CONNECTED') return true;
    try {
      const id = await this.client.getNumberId(phone);
      return !!id;
    } catch {
      return true;
    }
  }

  async stop() {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
  }
}
