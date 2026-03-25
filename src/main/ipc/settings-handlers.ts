import type { IpcMain } from 'electron'
import { getDb } from '../db'

export interface SmtpSettings {
  smtp_host: string
  smtp_port: string
  smtp_secure: string
  smtp_user: string
  smtp_pass: string
  smtp_from: string
  sig_name: string
  sig_company: string
  sig_address1: string
  sig_address2: string
  sig_phone: string
  sig_email: string
  sig_website: string
}

const KEYS: (keyof SmtpSettings)[] = [
  'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from',
  'sig_name', 'sig_company', 'sig_address1', 'sig_address2', 'sig_phone', 'sig_email', 'sig_website'
]

export function getSmtpSettings(): SmtpSettings {
  const db = getDb()
  const result: Partial<SmtpSettings> = {}
  for (const key of KEYS) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    result[key] = row?.value ?? ''
  }
  return result as SmtpSettings
}

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('settings:get', () => getSmtpSettings())

  ipcMain.handle('settings:save', (_e, data: SmtpSettings) => {
    const db = getDb()
    const upsert = db.prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    )
    const saveAll = db.transaction((s: SmtpSettings) => {
      for (const [k, v] of Object.entries(s)) upsert.run(k, v)
    })
    saveAll(data)
    return { success: true }
  })
}
