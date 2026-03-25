import { useEffect, useState } from 'react'
import type { Call } from '../../../preload/index.d'

function fmtDate(s: string) {
  return new Date(s).toLocaleString('de-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function fmtVerfuegbarkeit(call: Call) {
  if (call.verfuegbarkeit_typ === 'datetime' && call.verfuegbarkeit_wert) {
    return fmtDate(call.verfuegbarkeit_wert)
  }
  if (call.verfuegbarkeit_typ === 'freitext' && call.verfuegbarkeit_wert) {
    return call.verfuegbarkeit_wert
  }
  return '—'
}

function parseEmpfaenger(json: string): { name: string; email: string; rolle?: string }[] {
  try { return JSON.parse(json) } catch { return [] }
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [selected, setSelected] = useState<Call | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await window.api.calls.list()
    setCalls(data)
    if (selected) {
      const updated = data.find((c) => c.id === selected.id)
      setSelected(updated ?? null)
    }
  }

  async function onDelete(id: number) {
    await window.api.calls.delete(id)
    if (selected?.id === id) setSelected(null)
    await load()
  }

  return (
    <div className="flex h-full min-h-0">

      {/* ── Liste ──────────────────────────────────────────── */}
      <div className={`flex flex-col overflow-hidden ${selected ? 'w-[340px] border-r border-border' : 'w-full max-w-[900px]'}`}>
        <div
          className={selected ? 'px-5 pt-7 pb-4' : 'pb-4'}
          style={!selected ? { paddingTop: 'clamp(28px, 4vw, 56px)', paddingLeft: 'clamp(32px, 5vw, 72px)', paddingRight: 'clamp(32px, 5vw, 72px)' } : undefined}
        >
          <div className="section-head mb-0">
            Anruf-Verlauf
            <span className="ml-3 font-mono text-[10px] text-[#444]">
              {calls.length} Einträge
            </span>
          </div>
        </div>

        {calls.length === 0 ? (
          <div className={`font-mono text-[11px] text-[#444] ${selected ? 'px-5 py-4' : 'py-4'}`}
            style={!selected ? { paddingLeft: 'clamp(32px, 5vw, 72px)', paddingRight: 'clamp(32px, 5vw, 72px)' } : undefined}>
            — Noch keine Anrufe erfasst.
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {calls.map((c) => {
              const active = selected?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(active ? null : c)}
                  className={`block w-full text-left border-r-0 border-t-0 border-b border-b-[#1a1a1a] border-solid border-l-2 cursor-pointer transition-[background] duration-100 hover:bg-[#161616] ${
                    selected ? 'px-5 py-[14px]' : 'py-[14px]'
                  } ${active ? 'bg-[#1e1e1e] border-l-accent' : 'bg-transparent border-l-transparent'}`}
                  style={!selected ? { paddingLeft: 'clamp(32px, 5vw, 72px)', paddingRight: 'clamp(32px, 5vw, 72px)' } : undefined}
                >
                  <div className="flex items-baseline gap-[10px] mb-1">
                    <span className="font-mono text-[12px] text-text font-semibold">{c.anrufer}</span>
                    {c.firma && <span className="font-mono text-[11px] text-[#666]">{c.firma}</span>}
                    {c.verfuegbarkeit_typ !== 'none' && (
                      <span className="font-mono text-[9px] text-accent tracking-[0.1em] uppercase ml-auto">
                        Verfügbar
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <span className="font-mono text-[10px] text-muted">{c.telefon}</span>
                    <span className="font-mono text-[10px] text-[#444]">{fmtDate(c.created_at)}</span>
                  </div>
                  {!selected && (
                    <div className="mt-[6px] font-sans text-[12px] text-[#666] overflow-hidden text-ellipsis whitespace-nowrap max-w-[560px]">
                      {c.anliegen}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Detail ─────────────────────────────────────────── */}
      {selected && (
        <div className="flex-1 overflow-y-auto px-12 py-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="font-mono text-[18px] text-[#f0f0f0] font-semibold mb-[6px]">
                {selected.anrufer}
                {selected.firma && <span className="text-[14px] text-[#666] ml-3 font-normal">{selected.firma}</span>}
              </div>
              <div className="font-mono text-[11px] text-muted">{fmtDate(selected.created_at)}</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(selected.id)}>Löschen</button>
          </div>

          <Field label="Telefon" value={selected.telefon} mono />

          <div className="mb-6">
            <div className="field-label">Anliegen</div>
            <div className="font-sans text-[13px] text-[#d0d0d0] leading-[1.7] whitespace-pre-wrap bg-surface border border-border px-[14px] py-3">
              {selected.anliegen}
            </div>
          </div>

          <Field
            label="Verfügbarkeit"
            value={fmtVerfuegbarkeit(selected)}
            highlight={selected.verfuegbarkeit_typ !== 'none'}
          />

          <div className="mb-6">
            <div className="field-label">Benachrichtigt</div>
            {parseEmpfaenger(selected.empfaenger).length === 0 ? (
              <span className="font-mono text-[11px] text-[#444]">—</span>
            ) : (
              <div className="flex flex-col gap-[6px]">
                {parseEmpfaenger(selected.empfaenger).map((e, i) => (
                  <div key={i} className="flex items-center gap-3 font-mono text-[12px]">
                    <span className="text-success text-[10px]">✓</span>
                    <span className="text-[#d0d0d0]">{e.name}</span>
                    <span className="text-muted">{e.email}</span>
                    {e.rolle === 'cc' && (
                      <span className="text-[9px] text-[#6b7280] border border-border px-[6px] py-px tracking-[0.08em]">CC</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="mb-6">
      <div className="field-label">{label}</div>
      <div className={`text-[13px] ${mono ? 'font-mono' : 'font-sans'} ${highlight ? 'text-accent font-semibold' : 'text-[#d0d0d0] font-normal'}`}>
        {value || '—'}
      </div>
    </div>
  )
}
