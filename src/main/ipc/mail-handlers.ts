import type { IpcMain } from 'electron'
import { shell, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import nodemailer from 'nodemailer'
import { getDb } from '../db'
import { getSmtpSettings } from './settings-handlers'

export interface CallData {
  anrufer: string
  firma: string
  telefon: string
  anliegen: string
  verfuegbarkeitTyp: 'none' | 'datetime' | 'freitext'
  verfuegbarkeitWert: string
  empfaengerIds: number[]
  ccIds: number[]
}

function fmtVerfuegbarkeit(d: CallData): string | null {
  if (d.verfuegbarkeitTyp === 'datetime' && d.verfuegbarkeitWert) {
    return new Date(d.verfuegbarkeitWert).toLocaleString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }
  if (d.verfuegbarkeitTyp === 'freitext' && d.verfuegbarkeitWert) {
    return d.verfuegbarkeitWert
  }
  return null
}

function buildHtml(d: CallData, recipientFirstName: string): string {
  const cfg = getSmtpSettings()
  const verf = fmtVerfuegbarkeit(d)

  const line = (label: string, value: string) =>
    `<p style="margin:0;mso-para-margin:0;font-size:15px;line-height:21px;mso-line-height-rule:exactly;"><span style="color:#888;">${label}</span><span style="color:#aaa;"> &#8594; </span><span style="color:#1a1a1a;">${value.replace(/\n/g, ' ')}</span></p>`

  const sigCompany = cfg.sig_company ? `<strong>${cfg.sig_company}</strong><br>` : ''
  const sigAddress1 = cfg.sig_address1 ? `${cfg.sig_address1}<br>` : ''
  const sigAddress2 = cfg.sig_address2 ? `${cfg.sig_address2}` : ''
  const sigPhone = cfg.sig_phone ? `<p style="margin:0 0 10px 0;font-size:12px;color:#555;">T ${cfg.sig_phone}</p>` : ''
  const sigEmail = cfg.sig_email ? `<a href="mailto:${cfg.sig_email}" style="color:#004279;text-decoration:none;">${cfg.sig_email}</a><br>` : ''
  const sigWebsite = cfg.sig_website ? `<a href="http://${cfg.sig_website.replace(/^https?:\/\//, '')}" style="color:#004279;text-decoration:none;">${cfg.sig_website}</a>` : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<!--[if mso]><style>p{margin:0;mso-para-margin:0;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;">
  <p style="margin:0 0 18px 0;mso-para-margin:0 0 18px 0;font-size:15px;">Ciao ${recipientFirstName}</p>

  <div style="margin-bottom:18px;">
    ${line('Anliegen', d.anliegen)}
    ${line('Telefon', d.telefon)}
    ${verf ? line('Verfügbarkeit', verf) : ''}
  </div>

  <p style="margin:0 0 20px 0;font-size:15px;">Mit freundlichen Grüssen</p>

  <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;">${cfg.sig_name || ''}</p>

  <hr style="border:none;border-top:1px solid #d4d4d4;margin:0 0 14px 0;width:200px;text-align:left;">

  ${(sigCompany || sigAddress1 || sigAddress2) ? `<p style="margin:0 0 10px 0;font-size:12px;color:#555;">${sigCompany}${sigAddress1}${sigAddress2}</p>` : ''}
  ${sigPhone}
  ${(sigEmail || sigWebsite) ? `<p style="margin:0 0 14px 0;font-size:12px;">${sigEmail}${sigWebsite}</p>` : ''}

  <hr style="border:none;border-top:1px solid #d4d4d4;margin:0;width:200px;text-align:left;">
</body></html>`
}

export function registerMailHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('mail:send', async (_e, data: CallData) => {
    const db = getDb()
    const cfg = getSmtpSettings()
    const transport = makeTransport(cfg)

    type ContactRow = { id: number; name: string; email: string }
    const getContact = (id: number) => db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as ContactRow

    const toContacts = data.empfaengerIds.map(getContact).filter(Boolean)
    const ccContacts = (data.ccIds ?? []).map(getContact).filter(Boolean)

    const firma = data.firma ? ` - ${data.firma}` : ''
    const subject = `RR -> ${data.anrufer}${firma}`

    const recipientFirstName = toContacts[0]?.name.split(' ')[0] ?? 'zusammen'
    const html = buildHtml(data, recipientFirstName)

    const toStr = toContacts.map((c) => `${c.name} <${c.email}>`).join(', ')
    const ccStr = ccContacts.map((c) => `${c.name} <${c.email}>`).join(', ')

    await transport.sendMail({
      from: cfg.smtp_from,
      to: toStr,
      ...(ccStr ? { cc: ccStr } : {}),
      subject,
      html,
    })

    if (cfg.smtp_bcc_self === 'true' && (cfg.smtp_bcc_addr || cfg.smtp_from)) {
      await transport.sendMail({
        from: cfg.smtp_from,
        to: cfg.smtp_bcc_addr || cfg.smtp_from,
        subject: `[Kopie Recall Manager] ${subject}`,
        html,
      })
    }
    return { sent: toContacts.length + ccContacts.length }
  })

  ipcMain.handle('mail:compose', async (_e, data: CallData) => {
    const db = getDb()
    const cfg = getSmtpSettings()

    type ContactRow = { id: number; name: string; email: string }
    const getContact = (id: number) => db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as ContactRow

    const toContacts = data.empfaengerIds.map(getContact).filter(Boolean)
    const ccContacts = (data.ccIds ?? []).map(getContact).filter(Boolean)

    const firma = data.firma ? ` - ${data.firma}` : ''
    const subject = `RR -> ${data.anrufer}${firma}`

    const recipientFirstName = toContacts[0]?.name.split(' ')[0] ?? 'zusammen'
    const html = buildHtml(data, recipientFirstName)

    const toStr = toContacts.map((c) => `${c.name} <${c.email}>`).join(', ')
    const ccStr = ccContacts.map((c) => `${c.name} <${c.email}>`).join(', ')

    const emlLines = [
      'MIME-Version: 1.0',
      'X-Unsent: 1',
      `From: ${cfg.smtp_from || ''}`,
      `To: ${toStr}`,
      ...(ccStr ? [`CC: ${ccStr}`] : []),
      `Subject: ${subject}`,
      'Content-Type: text/html; charset="utf-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      html
    ]
    const emlContent = emlLines.join('\r\n')
    const tmpFile = path.join(app.getPath('temp'), `recall_${Date.now()}.eml`)
    fs.writeFileSync(tmpFile, emlContent, 'utf-8')
    const err = await shell.openPath(tmpFile)
    if (err) throw new Error(err)
    return { success: true }
  })

  ipcMain.handle('mail:test', async (_e, testEmail: string) => {
    const cfg = getSmtpSettings()
    const transport = makeTransport(cfg)
    await transport.verify()
    await transport.sendMail({
      from: cfg.smtp_from,
      to: testEmail,
      subject: 'SMTP-Test – Recall Manager',
      text: 'SMTP-Verbindung erfolgreich konfiguriert.'
    })
    return { success: true }
  })
}

function makeTransport(cfg: ReturnType<typeof getSmtpSettings>) {
  return nodemailer.createTransport({
    host: cfg.smtp_host,
    port: Number(cfg.smtp_port) || 587,
    secure: cfg.smtp_secure === 'true',
    auth: cfg.smtp_user ? { user: cfg.smtp_user, pass: cfg.smtp_pass } : undefined
  })
}
