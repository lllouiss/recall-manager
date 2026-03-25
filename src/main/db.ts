import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'recall-manager.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT NOT NULL,
      email TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS calls (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      anrufer          TEXT NOT NULL,
      firma            TEXT NOT NULL DEFAULT '',
      telefon          TEXT NOT NULL,
      anliegen         TEXT NOT NULL,
      verfuegbarkeit_typ  TEXT NOT NULL DEFAULT 'none',
      verfuegbarkeit_wert TEXT NOT NULL DEFAULT '',
      empfaenger       TEXT NOT NULL DEFAULT '[]',
      created_at       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `)

  // Migrate existing databases: add new columns if missing, drop old ones
  const cols = (db.prepare(`PRAGMA table_info(calls)`).all() as { name: string }[]).map(c => c.name)
  if (!cols.includes('verfuegbarkeit_typ')) {
    db.exec(`ALTER TABLE calls ADD COLUMN verfuegbarkeit_typ TEXT NOT NULL DEFAULT 'none'`)
  }
  if (!cols.includes('verfuegbarkeit_wert')) {
    db.exec(`ALTER TABLE calls ADD COLUMN verfuegbarkeit_wert TEXT NOT NULL DEFAULT ''`)
  }

  console.log('DB ready:', dbPath)
}
