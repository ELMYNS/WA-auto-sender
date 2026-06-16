import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { AppDatabase } from './services/database';
import { WhatsAppClient } from './services/whatsapp-client';
import { CampaignEngine } from './services/campaign-engine';
import { extractMoroccanNumbers } from './services/number-parser';

let mainWindow: BrowserWindow | null = null;
let db: AppDatabase;
let openwa: WhatsAppClient;
let campaign: CampaignEngine;

const isDev = !app.isPackaged;

function iconPath(): string {
  const candidates = [
    path.join(process.resourcesPath || '', 'icon.png'),
    path.join(app.getAppPath(), 'resources', 'icon.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[1];
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'WA Auto Sender',
    icon: iconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function broadcast(channel: string, data: unknown) {
  mainWindow?.webContents.send(channel, data);
}

app.whenReady().then(async () => {
  const userData = app.getPath('userData');
  db = new AppDatabase(userData);
  openwa = new WhatsAppClient(userData, process.resourcesPath || '', app.getAppPath());
  campaign = new CampaignEngine(db, openwa);

  openwa.setStatusCallback((status) => broadcast('openwa:update', status));
  campaign.setUpdateCallback((status) => broadcast('campaign:update', status));

  createWindow();

  // Démarre le moteur WhatsApp en arrière-plan
  setTimeout(() => {
    openwa.start().catch((err) => {
      broadcast('openwa:update', {
        ...openwa.getStatus(),
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  openwa?.stop();
  db?.close();
  if (process.platform !== 'darwin') app.quit();
});

function getFullOpenWAStatus() {
  return openwa.getStatus();
}

// IPC Handlers
ipcMain.handle('settings:get', () => db.getSettings());
ipcMain.handle('settings:save', (_e, partial) => db.saveSettings(partial));

ipcMain.handle('openwa:status', () => getFullOpenWAStatus());
ipcMain.handle('openwa:start', async () => {
  await openwa.start();
  return getFullOpenWAStatus();
});
ipcMain.handle('openwa:createSession', async () => {
  await openwa.createSession();
  return getFullOpenWAStatus();
});
ipcMain.handle('openwa:refreshQR', () => getFullOpenWAStatus());
ipcMain.handle('openwa:logout', async () => {
  campaign.stop();
  await openwa.logout();
  return getFullOpenWAStatus();
});
ipcMain.handle('app:reset', async () => {
  campaign.stop();
  db.clearContacts();
  await openwa.logout();
  return getFullOpenWAStatus();
});

ipcMain.handle('contacts:importFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Importer des numéros',
    filters: [
      { name: 'Fichiers', extensions: ['txt', 'csv', 'xlsx', 'xls'] },
      { name: 'Tous', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    text = XLSX.utils.sheet_to_csv(sheet);
  } else {
    text = fs.readFileSync(filePath, 'utf-8');
  }

  const phones = extractMoroccanNumbers(text);
  const { imported, duplicates } = db.importContacts(phones, path.basename(filePath));
  return { imported, duplicates, invalid: 0, phones };
});

ipcMain.handle('contacts:importText', (_e, text: string) => {
  const phones = extractMoroccanNumbers(text);
  const { imported, duplicates } = db.importContacts(phones, 'paste');
  return { imported, duplicates, invalid: 0, phones };
});

ipcMain.handle('contacts:list', (_e, filter?: string) => db.getContacts(filter));
ipcMain.handle('contacts:delete', (_e, id: number) => db.deleteContact(id));
ipcMain.handle('contacts:reset', (_e, ids: number[]) => db.resetContactStatus(ids));
ipcMain.handle('contacts:clear', (_e, status?: string) => db.clearContacts(status));
ipcMain.handle('contacts:export', async (_e, status: string) => {
  const content = db.exportContacts(status);
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `contacts-${status}.txt`,
    filters: [{ name: 'Texte', extensions: ['txt'] }],
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return result.filePath;
});

ipcMain.handle('templates:list', () => db.getTemplates());
ipcMain.handle('templates:save', (_e, template) => db.saveTemplate(template));
ipcMain.handle('templates:delete', (_e, id: number) => db.deleteTemplate(id));

ipcMain.handle('campaign:status', () => campaign.getStatus());
ipcMain.handle('campaign:start', async (_e, templateId: number, useArabic: boolean) => {
  const status = getFullOpenWAStatus();
  if (status.sessionStatus !== 'CONNECTED') {
    throw new Error('WhatsApp non connecté. Scannez le QR code d\'abord.');
  }
  campaign.start(templateId, useArabic);
});
ipcMain.handle('campaign:pause', () => campaign.pause());
ipcMain.handle('campaign:resume', () => campaign.resume());
ipcMain.handle('campaign:stop', () => campaign.stop());
