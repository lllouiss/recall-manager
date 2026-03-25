import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Contact } from '../../../preload/index.d'

interface EditState { id: number; name: string; email: string }

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [edit, setEdit] = useState<EditState | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; email: string }>()

  useEffect(() => { load() }, [])

  async function load() { setContacts(await window.api.contacts.getAll()) }

  async function onCreate(data: { name: string; email: string }) {
    await window.api.contacts.create(data)
    reset()
    await load()
  }

  async function onUpdate() {
    if (!edit) return
    await window.api.contacts.update(edit.id, { name: edit.name, email: edit.email })
    setEdit(null)
    await load()
  }

  async function onDelete(id: number) {
    await window.api.contacts.delete(id)
    await load()
  }

  return (
    <div className="page-wrap-wide">
      <div className="section-head">Empfänger verwalten</div>

      {/* Table */}
      {contacts.length === 0 ? (
        <p className="font-mono text-[11px] text-[#555] mb-10">
          — Noch keine Empfänger vorhanden.
        </p>
      ) : (
        <table className="w-full font-mono text-[12px] mb-12" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="border-b border-border">
              {['#', 'Name', 'E-Mail', ''].map((h) => (
                <th key={h} className="text-left px-[14px] py-2 text-[#555] font-normal text-[10px] tracking-[0.1em] uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => {
              if (edit?.id === c.id) {
                return (
                  <tr key={c.id} className="bg-[#1c1c1c] border-b border-border">
                    <td className="px-[14px] py-[10px] text-[#444] w-10">{String(c.id).padStart(3, '0')}</td>
                    <td className="px-[14px] py-2">
                      <input className="field-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
                    </td>
                    <td className="px-[14px] py-2">
                      <input className="field-input" type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
                    </td>
                    <td className="px-[14px] py-2">
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={onUpdate}>Speichern</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEdit(null)}>Abbruch</button>
                      </div>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={c.id} className="border-b border-b-[#1a1a1a] hover:bg-[#161616] transition-[background] duration-100">
                  <td className="px-[14px] py-3 text-[#444] w-10">{String(c.id).padStart(3, '0')}</td>
                  <td className="px-[14px] py-3 text-[#e5e5e5]">{c.name}</td>
                  <td className="px-[14px] py-3 text-[#777]">{c.email}</td>
                  <td className="px-[14px] py-3">
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ id: c.id, name: c.name, email: c.email })}>Bearbeiten</button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(c.id)}>Löschen</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Add form */}
      <div className="border-t border-border pt-8 max-w-[600px]">
        <p className="field-label mb-5">Neuer Empfänger</p>
        <form onSubmit={handleSubmit(onCreate)} noValidate>
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <label className="field-label">Name *</label>
              <input className={`field-input ${errors.name ? '!border-error' : ''}`} placeholder="Max Mustermann"
                {...register('name', { required: true })} />
            </div>
            <div>
              <label className="field-label">E-Mail *</label>
              <input type="email" className={`field-input ${errors.email ? '!border-error' : ''}`} placeholder="max@example.com"
                {...register('email', { required: true })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">+ Hinzufügen</button>
        </form>
      </div>
    </div>
  )
}
