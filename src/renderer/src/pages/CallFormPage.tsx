import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Contact } from '../../../preload/index.d'

interface FormValues {
  anrufer: string
  firma: string
  telefon: string
  anliegen: string
  verfuegbarkeitWert: string
  empfaengerIds: number[]
  ccIds: number[]
}

type Status = { type: 'success'; msg: string } | { type: 'error'; msg: string } | null

export default function CallFormPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [status, setStatus] = useState<Status>(null)
  const [sending, setSending] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { anrufer: '', firma: '', telefon: '', anliegen: '', verfuegbarkeitWert: '', empfaengerIds: [], ccIds: [] }
  })

  const empfaengerIds = watch('empfaengerIds')
  const ccIds = watch('ccIds')

  useEffect(() => { window.api.contacts.getAll().then(setContacts) }, [])

  function setRole(id: number, role: 'to' | 'cc' | null) {
    const toList = empfaengerIds.filter((x) => x !== id)
    const ccList = ccIds.filter((x) => x !== id)
    setValue('empfaengerIds', role === 'to' ? [...toList, id] : toList)
    setValue('ccIds', role === 'cc' ? [...ccList, id] : ccList)
  }

  function buildCallPayload(data: FormValues) {
    return {
      anrufer: data.anrufer, firma: data.firma, telefon: data.telefon,
      anliegen: data.anliegen,
      verfuegbarkeitTyp: data.verfuegbarkeitWert ? 'freitext' : 'none',
      verfuegbarkeitWert: data.verfuegbarkeitWert,
      empfaengerIds: data.empfaengerIds,
      ccIds: data.ccIds
    }
  }

  async function saveCallRecord(data: FormValues) {
    const empfaengerDetails = [
      ...contacts.filter((c) => data.empfaengerIds.includes(c.id)).map((c) => ({ name: c.name, email: c.email, rolle: 'to' as const })),
      ...contacts.filter((c) => data.ccIds.includes(c.id)).map((c) => ({ name: c.name, email: c.email, rolle: 'cc' as const }))
    ]
    await window.api.calls.create({
      anrufer: data.anrufer, firma: data.firma, telefon: data.telefon,
      anliegen: data.anliegen,
      verfuegbarkeit_typ: data.verfuegbarkeitWert ? 'freitext' : 'none',
      verfuegbarkeit_wert: data.verfuegbarkeitWert,
      empfaenger: JSON.stringify(empfaengerDetails)
    })
  }

  async function onSubmit(data: FormValues) {
    if (data.empfaengerIds.length === 0) {
      setStatus({ type: 'error', msg: 'Mindestens einen Empfänger (An) auswählen.' })
      return
    }
    setSending(true)
    setStatus(null)
    try {
      const result = await window.api.mail.send(buildCallPayload(data))
      await saveCallRecord(data)
      setStatus({ type: 'success', msg: `E-Mail erfolgreich an ${result.sent} Empfänger versandt.` })
      reset()
    } catch (err) {
      setStatus({ type: 'error', msg: `Fehler: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSending(false)
    }
  }

  async function onOpenOutlook(data: FormValues) {
    if (data.empfaengerIds.length === 0) {
      setStatus({ type: 'error', msg: 'Mindestens einen Empfänger (An) auswählen.' })
      return
    }
    setSending(true)
    setStatus(null)
    try {
      await window.api.mail.compose(buildCallPayload(data))
      await saveCallRecord(data)
      setStatus({ type: 'success', msg: 'E-Mail in Outlook geöffnet.' })
      reset()
    } catch (err) {
      setStatus({ type: 'error', msg: `Fehler: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="section-head">Anruf erfassen</div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Name + Firma */}
        <div className="grid grid-cols-2 gap-5 mb-7">
          <div>
            <label className="field-label">Anrufer Name *</label>
            <input className={`field-input ${errors.anrufer ? '!border-error' : ''}`} placeholder="Max Mustermann"
              {...register('anrufer', { required: true })} />
          </div>
          <div>
            <label className="field-label">Firma</label>
            <input className="field-input" placeholder="Muster AG" {...register('firma')} />
          </div>
        </div>

        {/* Telefon */}
        <div className="mb-7">
          <label className="field-label">Telefonnummer *</label>
          <input className={`field-input ${errors.telefon ? '!border-error' : ''}`} placeholder="+41 44 123 45 67"
            {...register('telefon', { required: true })} />
        </div>

        {/* Anliegen */}
        <div className="mb-7">
          <label className="field-label">Anliegen *</label>
          <textarea className={`field-input ${errors.anliegen ? '!border-error' : ''}`} rows={5} placeholder="Worum geht es beim Anruf…"
            {...register('anliegen', { required: true })} />
        </div>

        {/* Verfügbarkeit */}
        <div className="mb-7">
          <label className="field-label">Verfügbarkeit</label>
          <input className="field-input" placeholder="z. B. Morgen 08:00–09:00 und 14:00–16:00"
            {...register('verfuegbarkeitWert')} />
        </div>

        {/* Empfänger */}
        <div className="mb-9">
          <label className="field-label">Empfänger</label>
          {contacts.length === 0 ? (
            <p className="font-mono text-[11px] text-muted">
              — Noch keine Empfänger. Bitte unter «Empfänger» hinzufügen.
            </p>
          ) : (
            <div className="border border-border bg-surface">
              {contacts.map((c, i) => {
                const isTo = empfaengerIds.includes(c.id)
                const isCc = ccIds.includes(c.id)
                return (
                  <div key={c.id} className={`flex items-center gap-[14px] px-4 py-[10px] ${i > 0 ? 'border-t border-[#1e1e1e]' : ''} ${isTo ? 'bg-surface-alt' : isCc ? 'bg-[#181818]' : 'bg-transparent'}`}>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[12px] text-text">{c.name}</span>
                      <span className="font-mono text-[11px] text-muted ml-3">{c.email}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <RoleBtn label="An" active={isTo} color="#e85d04" onClick={() => setRole(c.id, isTo ? null : 'to')} />
                      <RoleBtn label="CC" active={isCc} color="#6b7280" onClick={() => setRole(c.id, isCc ? null : 'cc')} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex flex-wrap items-center gap-3 mt-2 pt-7 border-t border-border">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Sende…' : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Absenden
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={sending}
            onClick={handleSubmit(onOpenOutlook)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
            </svg>
            In Outlook öffnen
          </button>
          {status && (
            <span className={`font-mono text-[11px] tracking-[0.03em] ${status.type === 'success' ? 'text-success' : 'text-error'}`}>
              {status.type === 'success' ? '✓' : '✗'} {status.msg}
            </span>
          )}
        </div>

      </form>
    </div>
  )
}

function RoleBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        fontFamily: 'IBM Plex Mono',
        fontSize: 10,
        letterSpacing: '0.06em',
        background: active ? color : 'transparent',
        color: active ? '#fff' : '#444',
        border: `1px solid ${active ? color : '#2a2a2a'}`,
        cursor: 'pointer',
        transition: 'background 0.1s, color 0.1s, border-color 0.1s'
      }}
    >
      {label}
    </button>
  )
}
