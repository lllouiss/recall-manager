import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase } from './db'
import { registerDbHandlers } from './ipc/db-handlers'
import { registerMailHandlers } from './ipc/mail-handlers'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import { registerDataHandlers } from './ipc/data-handlers'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const icon = is.dev
    ? join(app.getAppPath(), 'resources/logo.png')
    : join(process.resourcesPath, 'logo.png')

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 820,
    minHeight: 560,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('maximize',   () => mainWindow?.webContents.send('window:maximized', true))
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized', false))
  mainWindow.on('closed',     () => { mainWindow = null })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.recall-manager')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  ipcMain.handle('window:minimize',    () => mainWindow?.minimize())
  ipcMain.handle('window:maximize',    () => {
    if (!mainWindow) return
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  })
  ipcMain.handle('window:close',       () => mainWindow?.close())
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

  initDatabase()
  registerDbHandlers(ipcMain)
  registerMailHandlers(ipcMain)
  registerSettingsHandlers(ipcMain)
  registerDataHandlers(ipcMain)

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
