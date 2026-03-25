import type { IpcMain } from 'electron'
import { dialog } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import { getDb } from '../db'
import { getSmtpSettings } from './settings-handlers'
import type { SmtpSettings } from './settings-handlers'

interface ExportData {
  version: number
  exported_at: string
  smtp: SmtpSettings
  contacts: { name: string; email: string }[]
  calls: {
    anrufer: string; firma: string; telefon: string; anliegen: string
    verfuegbarkeit_typ: string; verfuegbarkeit_wert: string
    empfaenger: string; created_at: string
  }[]
}

export function registerDataHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('data:export', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Daten exportieren',
      defaultPath: `recall-manager-export-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (canceled || !filePath) return { canceled: true }

    const db = getDb()
    const data: ExportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      smtp: getSmtpSettings(),
      contacts: (db.prepare('SELECT name, email FROM contacts ORDER BY id ASC').all() as { name: string; email: string }[]),
      calls: (db.prepare('SELECT anrufer, firma, telefon, anliegen, verfuegbarkeit_typ, verfuegbarkeit_wert, empfaenger, created_at FROM calls ORDER BY created_at ASC').all() as ExportData['calls'])
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { canceled: false, path: filePath }
  })

  ipcMain.handle('data:import', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Daten importieren',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { canceled: true }

    let data: ExportData
    try {
      data = JSON.parse(readFileSync(filePaths[0], 'utf-8')) as ExportData
    } catch {
      throw new Error('Datei konnte nicht gelesen werden oder ist kein gültiges JSON.')
    }

    if (data.version !== 1) throw new Error('Unbekanntes Exportformat (version ≠ 1).')

    const db = getDb()
    const doImport = db.transaction(() => {
      // Replace all data
      db.exec('DELETE FROM contacts; DELETE FROM calls; DELETE FROM settings;')

      const insertContact = db.prepare('INSERT INTO contacts (name, email) VALUES (@name, @email)')
      for (const c of (data.contacts ?? [])) insertContact.run(c)

      const insertCall = db.prepare(`
        INSERT INTO calls (anrufer, firma, telefon, anliegen, verfuegbarkeit_typ, verfuegbarkeit_wert, empfaenger, created_at)
        VALUES (@anrufer, @firma, @telefon, @anliegen, @verfuegbarkeit_typ, @verfuegbarkeit_wert, @empfaenger, @created_at)
      `)
      for (const c of (data.calls ?? [])) insertCall.run(c)

      const upsertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      if (data.smtp) {
        for (const [k, v] of Object.entries(data.smtp)) upsertSetting.run(k, v)
      }
    })

    doImport()
    return {
      canceled: false,
      contacts: (data.contacts ?? []).length,
      calls: (data.calls ?? []).length
    }
  })
}
