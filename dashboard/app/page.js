'use client'

import { useState, useEffect, useRef } from 'react'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

function getRelativeTime(ts) {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatFocusTime(minutes) {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function useCountUp(target) {
  const [val, setVal] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    if (typeof target !== 'number') return
    const from = prevRef.current
    const to = target
    prevRef.current = to
    if (from === to) return

    const start = performance.now()
    const dur = 600
    const animate = (now) => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(from + (to - from) * eased))
      if (t < 1) requestAnimationFrame(animate)
      else setVal(to)
    }
    requestAnimationFrame(animate)
  }, [target])

  return val
}

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#0F1117',
      border: '1px solid #1F2937',
      borderLeft: '4px solid #1F2937',
      borderRadius: 12,
      padding: 20,
    }}>
      <div className="skeleton-shimmer" style={{ height: 24, width: 24, borderRadius: 6, marginBottom: 12 }} />
      <div className="skeleton-shimmer" style={{ height: 36, width: '60%', borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton-shimmer" style={{ height: 16, width: '80%', borderRadius: 6 }} />
    </div>
  )
}

function StatCard({ label, value, icon, borderColor, hoverColor, loading }) {
  const [hover, setHover] = useState(false)
  const animVal = useCountUp(typeof value === 'number' ? value : 0)
  const displayVal = typeof value === 'number' ? animVal : value

  if (loading) return <SkeletonCard />

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#0F1117',
        border: '1px solid #1F2937',
        borderLeft: `4px solid ${hover ? (hoverColor || borderColor) : borderColor}`,
        borderRadius: 12,
        padding: 20,
        transition: 'border-color 0.2s ease',
        cursor: 'default',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 6 }}>{displayVal}</div>
      <div style={{ fontSize: 14, color: '#9CA3AF' }}>{label}</div>
    </div>
  )
}

function FocusBanner({ active, minutesRemaining, actionsCount }) {
  if (active) {
    return (
      <div
        className="focus-banner-active"
        style={{
          background: 'rgba(124,58,237,0.12)',
          border: '1.5px solid #7C3AED',
          borderLeft: '4px solid #7C3AED',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#E2E8F0',
          fontWeight: 500,
          fontSize: 14,
        }}
      >
        <span style={{ fontSize: 20 }}>🧠</span>
        <span>
          Focus mode active
          {minutesRemaining > 0 && <span style={{ color: '#A855F7' }}> · {minutesRemaining}m remaining</span>}
          <span style={{ color: '#9CA3AF' }}> · Actions today: {actionsCount}</span>
        </span>
      </div>
    )
  }
  return (
    <div style={{
      background: '#0F1117',
      border: '1px solid #1F2937',
      borderRadius: 12,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: '#6B7280',
      fontSize: 14,
    }}>
      <span style={{ fontSize: 18, opacity: 0.5 }}>🎯</span>
      No active focus session · Start one from the extension
    </div>
  )
}

const TYPE_META = {
  email_drafted:     { icon: '✉️',  color: '#7C3AED', label: 'Email drafted' },
  email_sent:        { icon: '📨',  color: '#22C55E', label: 'Email sent' },
  conflict_detected: { icon: '⚠️', color: '#F59E0B', label: 'Conflict detected' },
  focus_started:     { icon: '⏱️',  color: '#7C3AED', label: 'Focus started' },
  focus_ended:       { icon: '⏱️',  color: '#9CA3AF', label: 'Focus ended' },
  task_completed:    { icon: '✅',  color: '#22C55E', label: 'Task completed' },
}

function ActivityRow({ entry, isNew }) {
  const [hover, setHover] = useState(false)
  const meta = TYPE_META[entry.type] || { icon: '⚡', color: '#F59E0B', label: entry.type }
  const desc = entry.subject
    ? `${meta.label}: "${entry.subject}"`
    : entry.event1
    ? `${entry.event1} vs ${entry.event2}`
    : meta.label

  return (
    <tr
      className={isNew ? 'new-row' : ''}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: '1px solid #1A1F2E',
        background: hover ? 'rgba(255,255,255,0.03)' : (entry._alt ? 'rgba(255,255,255,0.01)' : 'transparent'),
        transition: 'background 0.12s',
      }}
    >
      <td style={{ padding: '10px 16px', color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>
        {getRelativeTime(entry.timestamp)}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 18, lineHeight: 1 }}>
        <span title={meta.label}>{meta.icon}</span>
      </td>
      <td style={{ padding: '10px 12px', color: '#E2E8F0', fontSize: 13 }}>{desc}</td>
      <td style={{ padding: '10px 16px' }}>
        {entry.from && (
          <span style={{ color: '#4B5563', fontSize: 11, maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.from}
          </span>
        )}
      </td>
    </tr>
  )
}

function SkeletonTable() {
  return (
    <div style={{ padding: '20px 24px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <div className="skeleton-shimmer" style={{ width: 60, height: 14, borderRadius: 4, flexShrink: 0 }} />
          <div className="skeleton-shimmer" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }} />
          <div className="skeleton-shimmer" style={{ flex: 1, height: 14, borderRadius: 4 }} />
          <div className="skeleton-shimmer" style={{ width: 80, height: 14, borderRadius: 4, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div className="slug-bounce" style={{ fontSize: 48, marginBottom: 16 }}>🐌</div>
      <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 6 }}>No actions yet</p>
      <p style={{ color: '#374151', fontSize: 13 }}>
        Load the extension, connect Google, and SlugMind will start logging here.
      </p>
    </div>
  )
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      borderTop: '1px solid #1A1F2E',
    }}>
      <button
        onClick={() => onPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
        style={{
          padding: '6px 14px',
          background: page === 0 ? '#1A1F2E' : '#1E293B',
          border: '1px solid #2D3748',
          borderRadius: 7,
          color: page === 0 ? '#374151' : '#9CA3AF',
          fontSize: 13,
          cursor: page === 0 ? 'not-allowed' : 'pointer',
          fontFamily: FONT,
        }}
      >← Prev</button>
      <span style={{ fontSize: 12, color: '#4B5563' }}>
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={() => onPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={page >= totalPages - 1}
        style={{
          padding: '6px 14px',
          background: page >= totalPages - 1 ? '#1A1F2E' : '#1E293B',
          border: '1px solid #2D3748',
          borderRadius: 7,
          color: page >= totalPages - 1 ? '#374151' : '#9CA3AF',
          fontSize: 13,
          cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
          fontFamily: FONT,
        }}
      >Next →</button>
    </div>
  )
}

const PAGE_SIZE = 10

export default function DashboardPage() {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState({ emailsDrafted: 0, conflictsCaught: 0, tasksCompleted: 0, focusMinutes: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [newIds, setNewIds] = useState(new Set())
  const prevIdsRef = useRef(new Set())

  const loadData = async () => {
    try {
      const res = await fetch('/api/activity')
      if (!res.ok) return
      const data = await res.json()
      const incoming = data.activities || []

      const incomingIds = new Set(incoming.map(a => a.id))
      if (prevIdsRef.current.size > 0) {
        const added = [...incomingIds].filter(id => !prevIdsRef.current.has(id))
        if (added.length > 0) {
          const s = new Set(added)
          setNewIds(s)
          setTimeout(() => setNewIds(new Set()), 700)
        }
      }
      prevIdsRef.current = incomingIds

      setActivities(incoming)
      setStats(data.stats || {})
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 10000)
    return () => clearInterval(id)
  }, [])

  const activeFocus = activities.find(a =>
    a.type === 'focus_started' &&
    !activities.find(b => b.type === 'focus_ended' && b.timestamp > a.timestamp)
  )
  const todayCount = activities.filter(a =>
    new Date(a.timestamp).toDateString() === new Date().toDateString()
  ).length

  const totalPages = Math.ceil(activities.length / PAGE_SIZE)
  const pageItems = activities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 6 }}>
            {getGreeting()}, Pratik
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
            <span style={{ color: '#10B981', fontSize: 10 }}>●</span>
            Live · updates every 10s
          </div>
        </div>
        <div style={{
          background: '#0F1117',
          border: '1px solid #1F2937',
          borderRadius: 10,
          padding: '8px 14px',
          fontSize: 15,
          fontWeight: 600,
          color: '#9CA3AF',
          letterSpacing: '0.5px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <LiveClock />
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Emails drafted" value={stats.emailsDrafted} icon="✉️" borderColor="#7C3AED" hoverColor="#A855F7" loading={loading} />
        <StatCard label="Conflicts caught" value={stats.conflictsCaught} icon="⚠️" borderColor="#F59E0B" hoverColor="#FCD34D" loading={loading} />
        <StatCard label="Tasks completed" value={stats.tasksCompleted} icon="✅" borderColor="#10B981" hoverColor="#34D399" loading={loading} />
        <StatCard label="Focus time" value={formatFocusTime(stats.focusMinutes)} icon="⏱️" borderColor="#3B82F6" hoverColor="#60A5FA" loading={loading} />
      </div>

      {/* Focus banner */}
      <div style={{ marginBottom: 24 }}>
        <FocusBanner active={!!activeFocus} minutesRemaining={0} actionsCount={todayCount} />
      </div>

      {/* Action log */}
      <div style={{
        background: '#0F1117',
        border: '1px solid #1F2937',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1A1F2E',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>Action Log</h2>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#4B5563' }}>
            {activities.length} entries
          </span>
        </div>

        {loading ? (
          <SkeletonTable />
        ) : activities.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1A1F2E' }}>
                  <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                  <th style={{ padding: '8px 12px', width: 44 }} />
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((entry, i) => (
                  <ActivityRow
                    key={entry.id}
                    entry={{ ...entry, _alt: i % 2 === 1 }}
                    isNew={newIds.has(entry.id)}
                  />
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
