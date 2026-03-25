import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Contact } from '../../../preload/index.d'

type VerfTyp = 'none' | 'datetime' | 'freitext'

interface FormValues {
  anrufer: string
  firma: string
  telefon: string
  anliegen: string
  verfuegbarkeitTyp: VerfTyp
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
    defaultValues: { anrufer: '', firma: '', telefon: '', anliegen: '', verfuegbarkeitTyp: 'none', verfuegbarkeitWert: '', empfaengerIds: [], ccIds: [] }
  })

  const verfTyp = watch('verfuegbarkeitTyp')
  const empfaengerIds = watch('empfaengerIds')
  const ccIds = watch('ccIds')

  useEffect(() => { window.api.contacts.getAll().then(setContacts) }, [])

  function setRole(id: number, role: 'to' | 'cc' | null) {
    const toList = empfaengerIds.filter((x) => x !== id)
    const ccList = ccIds.filter((x) => x !== id)
    setValue('empfaengerIds', role === 'to' ? [...toList, id] : toList)
    setValue('ccIds', role === 'cc' ? [...ccList, id] : ccList)
  }

  async function onSubmit(data: FormValues) {
    if (data.empfaengerIds.length === 0) {
      setStatus({ type: 'error', msg: 'Mindestens einen Empfänger (An) auswählen.' })
      return
    }
    setSending(true)
    setStatus(null)
    try {
      const empfaengerDetails = [
        ...contacts.filter((c) => data.empfaengerIds.includes(c.id)).map((c) => ({ name: c.name, email: c.email, rolle: 'to' as const })),
        ...contacts.filter((c) => data.ccIds.includes(c.id)).map((c) => ({ name: c.name, email: c.email, rolle: 'cc' as const }))
      ]

      const result = await window.api.mail.send({
        anrufer: data.anrufer, firma: data.firma, telefon: data.telefon,
        anliegen: data.anliegen,
        verfuegbarkeitTyp: data.verfuegbarkeitTyp,
        verfuegbarkeitWert: data.verfuegbarkeitWert,
        empfaengerIds: data.empfaengerIds,
        ccIds: data.ccIds
      })

      await window.api.calls.create({
        anrufer: data.anrufer,
        firma: data.firma,
        telefon: data.telefon,
        anliegen: data.anliegen,
        verfuegbarkeit_typ: data.verfuegbarkeitTyp,
        verfuegbarkeit_wert: data.verfuegbarkeitWert,
        empfaenger: JSON.stringify(empfaengerDetails)
      })

      setStatus({ type: 'success', msg: `E-Mail erfolgreich an ${result.sent} Empfänger versandt.` })
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
        <div className="mb-7 py-[18px] border-y border-border">
          <div className="flex items-center gap-4">
            <span className="field-label mb-0 shrink-0">Verfügbarkeit</span>
            <div className="flex border border-border bg-[#111]">
              {(['none', 'datetime', 'freitext'] as const).map((opt) => {
                const labels = { none: 'Keine Angabe', datetime: 'Datum & Zeit', freitext: 'Freitext' }
                const active = verfTyp === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setValue('verfuegbarkeitTyp', opt); setValue('verfuegbarkeitWert', '') }}
                    className={`py-[7px] px-[14px] font-mono text-[11px] tracking-[0.04em] cursor-pointer transition-[background,color] duration-100 border-t-0 border-b-0 border-l-0 border-solid ${
                      opt !== 'freitext' ? 'border-r border-border' : 'border-r-0'
                    } ${active ? 'bg-accent text-white' : 'bg-transparent text-[#666]'}`}
                  >
                    {labels[opt]}
                  </button>
                )
              })}
            </div>
          </div>
          {verfTyp === 'datetime' && (
            <div className="mt-[14px]">
              <input type="datetime-local" className="field-input w-auto" {...register('verfuegbarkeitWert')} />
            </div>
          )}
          {verfTyp === 'freitext' && (
            <div className="mt-[14px]">
              <input className="field-input" placeholder="z. B. Morgen 08:00–09:00 und 14:00–16:00"
                {...register('verfuegbarkeitWert')} />
            </div>
          )}
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
        <div className="flex items-center gap-5 mt-2 pt-7 border-t border-border">
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
