import type { IpcMain } from 'electron'
import { getDb } from '../db'

interface Contact { name: string; email: string }

interface CallRow {
  anrufer: string; firma: string; telefon: string; anliegen: string
  verfuegbarkeit_typ: string; verfuegbarkeit_wert: string; empfaenger: string
}

export function registerDbHandlers(ipcMain: IpcMain): void {
  // ── Contacts ───────────────────────────────────────────────
  ipcMain.handle('contacts:getAll', () =>
    getDb().prepare('SELECT * FROM contacts ORDER BY name ASC').all()
  )
  ipcMain.handle('contacts:create', (_e, data: Contact) => {
    const r = getDb().prepare('INSERT INTO contacts (name, email) VALUES (@name, @email)').run(data)
    return { id: r.lastInsertRowid, ...data }
  })
  ipcMain.handle('contacts:update', (_e, id: number, data: Contact) => {
    getDb().prepare('UPDATE contacts SET name = @name, email = @email WHERE id = @id').run({ ...data, id })
    return { id, ...data }
  })
  ipcMain.handle('contacts:delete', (_e, id: number) => {
    getDb().prepare('DELETE FROM contacts WHERE id = ?').run(id)
    return { success: true }
  })

  // ── Calls ──────────────────────────────────────────────────
  ipcMain.handle('calls:list', () =>
    getDb().prepare('SELECT * FROM calls ORDER BY created_at DESC').all()
  )
  ipcMain.handle('calls:get', (_e, id: number) =>
    getDb().prepare('SELECT * FROM calls WHERE id = ?').get(id)
  )
  ipcMain.handle('calls:create', (_e, data: CallRow) => {
    const r = getDb().prepare(`
      INSERT INTO calls (anrufer, firma, telefon, anliegen, verfuegbarkeit_typ, verfuegbarkeit_wert, empfaenger)
      VALUES (@anrufer, @firma, @telefon, @anliegen, @verfuegbarkeit_typ, @verfuegbarkeit_wert, @empfaenger)
    `).run(data)
    return { id: r.lastInsertRowid }
  })
  ipcMain.handle('calls:delete', (_e, id: number) => {
    getDb().prepare('DELETE FROM calls WHERE id = ?').run(id)
    return { success: true }
  })
}
