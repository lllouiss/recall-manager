import { ElectronAPI } from '@electron-toolkit/preload'

export interface Contact { id: number; name: string; email: string }

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

export interface Call {
  id: number
  anrufer: string
  firma: string
  telefon: string
  anliegen: string
  verfuegbarkeit_typ: string
  verfuegbarkeit_wert: string
  empfaenger: string  // JSON: [{name, email}]
  created_at: string
}

export interface SmtpSettings {
  smtp_host: string; smtp_port: string; smtp_secure: string
  smtp_user: string; smtp_pass: string; smtp_from: string; smtp_bcc_self: string; smtp_bcc_addr: string
  sig_name: string; sig_company: string
  sig_address1: string; sig_address2: string
  sig_phone: string; sig_email: string; sig_website: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      window: {
        minimize:    () => Promise<void>
        maximize:    () => Promise<void>
        close:       () => Promise<void>
        isMaximized: () => Promise<boolean>
        onMaximized: (cb: (v: boolean) => void) => void
      }
      contacts: {
        getAll: () => Promise<Contact[]>
        create: (data: { name: string; email: string }) => Promise<Contact>
        update: (id: number, data: { name: string; email: string }) => Promise<Contact>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      calls: {
        list: () => Promise<Call[]>
        get: (id: number) => Promise<Call | undefined>
        create: (data: CallRecord) => Promise<{ id: number }>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      mail: {
        send: (data: CallData) => Promise<{ sent: number }>
        compose: (data: CallData) => Promise<{ success: boolean }>
        test: (testEmail: string) => Promise<{ success: boolean }>
      }
      settings: {
        get: () => Promise<SmtpSettings>
        save: (data: SmtpSettings) => Promise<{ success: boolean }>
      }
      data: {
        export: () => Promise<{ canceled: boolean; path?: string }>
        import: () => Promise<{ canceled: boolean; contacts?: number; calls?: number }>
      }
    }
  }
}
