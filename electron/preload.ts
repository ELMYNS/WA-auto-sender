import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './shared';

const api: ElectronAPI = {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getOpenWAStatus: () => ipcRenderer.invoke('openwa:status'),
  startOpenWA: () => ipcRenderer.invoke('openwa:start'),
  createSession: () => ipcRenderer.invoke('openwa:createSession'),
  refreshQR: () => ipcRenderer.invoke('openwa:refreshQR'),
  logoutWhatsApp: () => ipcRenderer.invoke('openwa:logout'),
  resetApp: () => ipcRenderer.invoke('app:reset'),
  importFile: () => ipcRenderer.invoke('contacts:importFile'),
  importText: (text) => ipcRenderer.invoke('contacts:importText', text),
  getContacts: (filter) => ipcRenderer.invoke('contacts:list', filter),
  deleteContact: (id) => ipcRenderer.invoke('contacts:delete', id),
  resetContactStatus: (ids) => ipcRenderer.invoke('contacts:reset', ids),
  clearContacts: (status) => ipcRenderer.invoke('contacts:clear', status),
  getTemplates: () => ipcRenderer.invoke('templates:list'),
  saveTemplate: (template) => ipcRenderer.invoke('templates:save', template),
  deleteTemplate: (id) => ipcRenderer.invoke('templates:delete', id),
  getCampaignStatus: () => ipcRenderer.invoke('campaign:status'),
  startCampaign: (templateId, useArabic) =>
    ipcRenderer.invoke('campaign:start', templateId, useArabic),
  pauseCampaign: () => ipcRenderer.invoke('campaign:pause'),
  resumeCampaign: () => ipcRenderer.invoke('campaign:resume'),
  stopCampaign: () => ipcRenderer.invoke('campaign:stop'),
  onCampaignUpdate: (callback) => {
    const handler = (_: unknown, status: Parameters<typeof callback>[0]) => callback(status);
    ipcRenderer.on('campaign:update', handler);
    return () => ipcRenderer.removeListener('campaign:update', handler);
  },
  onOpenWAUpdate: (callback) => {
    const handler = (_: unknown, status: Parameters<typeof callback>[0]) => callback(status);
    ipcRenderer.on('openwa:update', handler);
    return () => ipcRenderer.removeListener('openwa:update', handler);
  },
  exportContacts: (status) => ipcRenderer.invoke('contacts:export', status),
};

contextBridge.exposeInMainWorld('api', api);
