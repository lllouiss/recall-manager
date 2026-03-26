import React, { useEffect, useState } from 'react'
import CallFormPage from './pages/CallFormPage'
import CallsPage from './pages/CallsPage'
import ContactsPage from './pages/ContactsPage'
import SettingsPage from './pages/SettingsPage'

type Page = 'form' | 'calls' | 'contacts' | 'settings'

const NAV: { id: Page; label: string; icon: JSX.Element }[] = [
  {
    id: 'form',
    label: 'Anruf erfassen',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.91 12.32a19.79 19.79 0 01-3.07-8.63A2 2 0 012.82 1.5h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.15a16 16 0 006.29 6.29l.67-.67a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    )
  },
  {
    id: 'calls',
    label: 'Anruf-Verlauf',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    )
  },
  {
    id: 'contacts',
    label: 'Empfänger',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Einstellungen',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    )
  }
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const drag: any = { WebkitAppRegion: 'drag' }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noDrag: any = { WebkitAppRegion: 'no-drag' }

export default function App() {
  const [page, setPage] = useState<Page>('form')
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.api.window.isMaximized().then(setMaximized)
    window.api.window.onMaximized(setMaximized)
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <TitleBar maximized={maximized} />
      <div className="flex flex-1 min-h-0 bg-bg text-text">

        {/* ── Sidebar ───────────────────────────── */}
        <aside className="flex flex-col shrink-0 border-r border-border w-[220px] bg-[#0a0a0a]">
          <nav className="flex flex-col gap-0.5 p-3 flex-1">
            {NAV.map((item) => {
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex items-center gap-3 px-4 py-[14px] text-left w-full font-mono text-[13px] tracking-[0.05em] cursor-pointer transition-[background,color] duration-100 border-r-0 border-y-0 border-solid border-l-2 ${
                    active
                      ? 'bg-[#1e1e1e] text-[#f0f0f0] border-l-accent'
                      : 'bg-transparent text-[#777] border-l-transparent'
                  }`}
                >
                  <span className={`shrink-0 ${active ? 'text-accent' : 'text-[#555]'}`}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="px-5 py-3 border-t border-border font-mono text-[9px] tracking-[0.1em] text-[#3a3a3a]">
            RECALL MANAGER v{__APP_VERSION__}
          </div>
        </aside>

        {/* ── Main ──────────────────────────────── */}
        <main className="flex-1 bg-bg overflow-hidden flex flex-col">
          {page === 'form'     && <div className="flex-1 overflow-y-auto"><CallFormPage /></div>}
          {page === 'calls'    && <div className="flex-1 overflow-hidden flex"><CallsPage /></div>}
          {page === 'contacts' && <div className="flex-1 overflow-y-auto"><ContactsPage /></div>}
          {page === 'settings' && <div className="flex-1 overflow-y-auto"><SettingsPage /></div>}
        </main>
      </div>
    </div>
  )
}

function TitleBar({ maximized }: { maximized: boolean }) {
  return (
    <div className="h-10 bg-[#0a0a0a] flex items-center justify-between shrink-0 border-b border-border" style={drag}>
      <div className="pl-4 font-mono text-[11px] tracking-[0.15em] uppercase select-none" style={noDrag}>
        <span className="text-accent">●</span>
        <span className="text-[#555] ml-2">Recall Mgr</span>
      </div>
      <div className="flex" style={noDrag}>
        <WinBtn title="Minimieren" onClick={() => window.api.window.minimize()}>
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
        </WinBtn>
        <WinBtn title={maximized ? 'Verkleinern' : 'Maximieren'} onClick={() => window.api.window.maximize()}>
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2" y="0" width="8" height="8"/>
              <polyline points="0,2 0,10 8,10"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0" y="0" width="10" height="10"/>
            </svg>
          )}
        </WinBtn>
        <WinBtn title="Schließen" onClick={() => window.api.window.close()} isClose>
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <line x1="0" y1="0" x2="10" y2="10"/><line x1="10" y1="0" x2="0" y2="10"/>
          </svg>
        </WinBtn>
      </div>
    </div>
  )
}

function WinBtn({ children, onClick, title, isClose }: {
  children: React.ReactNode; onClick: () => void; title?: string; isClose?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-[46px] h-10 flex items-center justify-center shrink-0 border-none cursor-default transition-[background,color] duration-100 text-[#666] ${
        isClose ? 'hover:bg-[#c42b1c] hover:text-white' : 'hover:bg-[#1e1e1e]'
      }`}
    >
      {children}
    </button>
  )
}
