import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  window: {
    minimize:    () => ipcRenderer.invoke('window:minimize'),
    maximize:    () => ipcRenderer.invoke('window:maximize'),
    close:       () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
    onMaximized: (cb: (v: boolean) => void) => ipcRenderer.on('window:maximized', (_e, v) => cb(v))
  },
  contacts: {
    getAll: () => ipcRenderer.invoke('contacts:getAll'),
    create: (data: { name: string; email: string }) => ipcRenderer.invoke('contacts:create', data),
    update: (id: number, data: { name: string; email: string }) => ipcRenderer.invoke('contacts:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('contacts:delete', id)
  },
  calls: {
    list: () => ipcRenderer.invoke('calls:list'),
    get: (id: number) => ipcRenderer.invoke('calls:get', id),
    create: (data: CallRecord) => ipcRenderer.invoke('calls:create', data),
    delete: (id: number) => ipcRenderer.invoke('calls:delete', id)
  },
  mail: {
    send: (data: CallData) => ipcRenderer.invoke('mail:send', data),
    test: (testEmail: string) => ipcRenderer.invoke('mail:test', testEmail)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (data: SmtpSettings) => ipcRenderer.invoke('settings:save', data)
  },
  data: {
    export: () => ipcRenderer.invoke('data:export') as Promise<{ canceled: boolean; path?: string }>,
    import: () => ipcRenderer.invoke('data:import') as Promise<{ canceled: boolean; contacts?: number; calls?: number }>
  }
}

export interface CallData {
  anrufer: string; firma: string; telefon: string; anliegen: string
  verfuegbarkeitTyp: 'none' | 'datetime' | 'freitext'
  verfuegbarkeitWert: string
  empfaengerIds: number[]
  ccIds: number[]
}

export interface CallRecord {
  anrufer: string; firma: string; telefon: string; anliegen: string
  verfuegbarkeit_typ: string; verfuegbarkeit_wert: string; empfaenger: string
}

export interface SmtpSettings {
  smtp_host: string; smtp_port: string; smtp_secure: string
  smtp_user: string; smtp_pass: string; smtp_from: string
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (e) { console.error(e) }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
