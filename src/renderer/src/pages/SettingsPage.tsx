import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { SmtpSettings } from '../../../preload/index.d'

type Status = { type: 'success' | 'error'; msg: string } | null

export default function SettingsPage() {
  const [saveStatus, setSaveStatus] = useState<Status>(null)
  const [testStatus, setTestStatus] = useState<Status>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [exportStatus, setExportStatus] = useState<Status>(null)
  const [importStatus, setImportStatus] = useState<Status>(null)

  const { register, handleSubmit, reset, watch, setValue } = useForm<SmtpSettings>({
    defaultValues: {
      smtp_host: '', smtp_port: '587', smtp_secure: 'false',
      smtp_user: '', smtp_pass: '', smtp_from: '', smtp_bcc_self: 'false', smtp_bcc_addr: '',
      sig_name: '', sig_company: '', sig_address1: '',
      sig_address2: '', sig_phone: '', sig_email: '', sig_website: ''
    }
  })

  useEffect(() => {
    window.api.settings.get().then((s) => reset(s))
  }, [reset])

  async function onSave(data: SmtpSettings) {
    setSaveStatus(null)
    try {
      await window.api.settings.save(data)
      setSaveStatus({ type: 'success', msg: 'Einstellungen gespeichert.' })
    } catch (err) {
      setSaveStatus({ type: 'error', msg: err instanceof Error ? err.message : String(err) })
    }
  }

  async function onExport() {
    setExportStatus(null)
    try {
      const result = await window.api.data.export()
      if (!result.canceled) setExportStatus({ type: 'success', msg: `Exportiert nach ${result.path}` })
    } catch (err) {
      setExportStatus({ type: 'error', msg: err instanceof Error ? err.message : String(err) })
    }
  }

  async function onImport() {
    setImportStatus(null)
    try {
      const result = await window.api.data.import()
      if (!result.canceled) {
        setImportStatus({ type: 'success', msg: `${result.contacts} Empfänger, ${result.calls} Anrufe importiert.` })
        window.api.settings.get().then((s) => reset(s))
      }
    } catch (err) {
      setImportStatus({ type: 'error', msg: err instanceof Error ? err.message : String(err) })
    }
  }

  async function onTest() {
    if (!testEmail) return
    setTesting(true)
    setTestStatus(null)
    try {
      await window.api.mail.test(testEmail)
      setTestStatus({ type: 'success', msg: `Test-E-Mail an ${testEmail} versendet.` })
    } catch (err) {
      setTestStatus({ type: 'error', msg: err instanceof Error ? err.message : String(err) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="page-wrap">

      <form onSubmit={handleSubmit(onSave)} noValidate>

        {/* ── SMTP ─────────────────────────────────────── */}
        <div className="section-head">SMTP Einstellungen</div>

        <div className="grid gap-4 mb-7" style={{ gridTemplateColumns: '1fr 100px' }}>
          <div>
            <label className="field-label">SMTP Host</label>
            <input className="field-input" placeholder="smtp.example.com" {...register('smtp_host')} />
          </div>
          <div>
            <label className="field-label">Port</label>
            <input className="field-input" type="number" {...register('smtp_port')} />
          </div>
        </div>

        <div className="mb-7">
          <label className="flex items-center gap-[10px] font-mono text-[11px] text-[#888] cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-[13px] h-[13px] accent-accent"
              checked={watch('smtp_secure') === 'true'}
              onChange={(e) => setValue('smtp_secure', e.target.checked ? 'true' : 'false')}
            />
            SSL / TLS verwenden (Port 465)
          </label>
        </div>

        <div className="mb-7">
          <label className="field-label">Benutzername</label>
          <input className="field-input" placeholder="benutzer@example.com" {...register('smtp_user')} />
        </div>

        <div className="mb-7">
          <label className="field-label">Passwort</label>
          <input className="field-input" type="password" placeholder="••••••••" {...register('smtp_pass')} />
        </div>

        <div className="mb-7">
          <label className="field-label">Absender (From)</label>
          <input className="field-input" placeholder='"Recall Manager" <noreply@example.com>' {...register('smtp_from')} />
        </div>

        <div className="mb-5">
          <label className="flex items-center gap-[10px] font-mono text-[11px] text-[#888] cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-[13px] h-[13px] accent-accent"
              checked={watch('smtp_bcc_self') === 'true'}
              onChange={(e) => setValue('smtp_bcc_self', e.target.checked ? 'true' : 'false')}
            />
            Kopie automatisch an folgende Adresse senden
          </label>
        </div>

        <div className="mb-10">
          <input
            className="field-input"
            placeholder="eigene@email.ch"
            {...register('smtp_bcc_addr')}
            disabled={watch('smtp_bcc_self') !== 'true'}
          />
          <p className="font-mono text-[10px] text-[#555] mt-2">
            Wenn leer, wird die Absender-Adresse (From) verwendet.
          </p>
        </div>

        {/* ── Signatur ─────────────────────────────────── */}
        <div className="section-head">Signatur</div>

        <div className="grid grid-cols-2 gap-5 mb-7">
          <div>
            <label className="field-label">Name</label>
            <input className="field-input" placeholder="Louis Wenk" {...register('sig_name')} />
          </div>
          <div>
            <label className="field-label">Firma</label>
            <input className="field-input" placeholder="HL Informatik" {...register('sig_company')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-7">
          <div>
            <label className="field-label">Adresse 1</label>
            <input className="field-input" placeholder="Blegistrasse 3, 6340 Baar" {...register('sig_address1')} />
          </div>
          <div>
            <label className="field-label">Adresse 2</label>
            <input className="field-input" placeholder="Hauptstrasse 11, 5604 Hendschiken" {...register('sig_address2')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-7">
          <div>
            <label className="field-label">Telefon</label>
            <input className="field-input" placeholder="+41 62 885 60 60" {...register('sig_phone')} />
          </div>
          <div>
            <label className="field-label">E-Mail (Signatur)</label>
            <input className="field-input" placeholder="info@beispiel.ch" {...register('sig_email')} />
          </div>
        </div>

        <div className="mb-10">
          <label className="field-label">Website</label>
          <input className="field-input" placeholder="www.beispiel.ch" {...register('sig_website')} />
        </div>

        {/* ── Save ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 pb-9 mb-9 border-b border-border">
          <button type="submit" className="btn btn-primary">Speichern</button>
          {saveStatus && <StatusLine status={saveStatus} />}
        </div>

      </form>

      {/* ── Import / Export ──────────────────────────── */}
      <div className="mb-9">
        <p className="field-label mb-4">Import / Export</p>
        <p className="font-mono text-[11px] text-[#555] mb-5 leading-[1.6]">
          Export speichert alle Anrufe, Empfänger und Einstellungen als JSON-Datei.<br />
          Import ersetzt alle vorhandenen Daten vollständig.
        </p>
        <div className="flex flex-wrap gap-3 mb-4">
          <button className="btn btn-ghost" type="button" onClick={onExport}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-[6px]">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportieren
          </button>
          <button className="btn btn-ghost" type="button" onClick={onImport}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-[6px]">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10" transform="rotate(180 12 12)"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importieren…
          </button>
        </div>
        {exportStatus && <div className="mb-2"><StatusLine status={exportStatus} /></div>}
        {importStatus && <StatusLine status={importStatus} />}
      </div>

      <div className="border-t border-border mb-9" />

      {/* ── Test-Mail ────────────────────────────────── */}
      <div>
        <p className="field-label mb-4">Test-E-Mail senden</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="field-label">Empfänger-Adresse</label>
            <input
              className="field-input"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={onTest} disabled={testing || !testEmail} type="button">
            {testing ? 'Sende…' : 'Test senden'}
          </button>
        </div>
        {testStatus && <div className="mt-4"><StatusLine status={testStatus} /></div>}
      </div>

    </div>
  )
}

function StatusLine({ status }: { status: { type: 'success' | 'error'; msg: string } }) {
  return (
    <span className={`font-mono text-[11px] tracking-[0.03em] ${status.type === 'success' ? 'text-success' : 'text-error'}`}>
      {status.type === 'success' ? '✓' : '✗'} {status.msg}
    </span>
  )
}
