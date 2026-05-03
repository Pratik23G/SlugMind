'use client'

import { useState, useEffect } from 'react'
import ActionLog from '../components/ActionLog'
import StatusDot from '../components/StatusDot'
import FocusTimer from '../components/FocusTimer'

function getRelativeTime(timestamp) {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatFocusTime(minutes) {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getStatus(activities) {
  if (activities.some(a => a.type === 'focus_started' && !activities.find(b => b.type === 'focus_ended' && b.timestamp > a.timestamp))) return 'purple'
  if (activities.some(a => a.type === 'conflict_detected')) return 'red'
  if (activities.some(a => a.type === 'email_drafted')) return 'yellow'
  return 'green'
}

const TYPE_ICONS = {
  email_drafted:      { icon: 'ph-envelope',          color: '#6366f1', label: 'Email drafted' },
  email_sent:         { icon: 'ph-paper-plane-tilt',  color: '#22c55e', label: 'Email sent' },
  conflict_detected:  { icon: 'ph-warning',           color: '#ef4444', label: 'Conflict detected' },
  focus_started:      { icon: 'ph-timer',             color: '#7c3aed', label: 'Focus started' },
  focus_ended:        { icon: 'ph-timer',             color: '#94a3b8', label: 'Focus ended' },
  task_completed:     { icon: 'ph-check-circle',      color: '#22c55e', label: 'Task completed' },
}

function SummaryCard({ label, value, iconClass, color }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-5 flex flex-col gap-2 border border-slate-700/50">
      <i className={`ph ${iconClass}`} style={{ fontSize: '24px', color }} />
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  )
}

function ActivityRow({ entry }) {
  const meta = TYPE_ICONS[entry.type] || { icon: 'ph-lightning', color: '#f59e0b', label: entry.type }
  const desc = entry.subject
    ? `${meta.label}: "${entry.subject}"`
    : entry.event1
    ? `${entry.event1} vs ${entry.event2}`
    : meta.label

  return (
    <tr className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors">
      <td className="py-3 px-4 text-slate-400 text-sm whitespace-nowrap">
        {getRelativeTime(entry.timestamp)}
      </td>
      <td className="py-3 px-4">
        <i className={`ph ${meta.icon}`} style={{ fontSize: '18px', color: meta.color }} />
      </td>
      <td className="py-3 px-4 text-slate-200 text-sm">{desc}</td>
      <td className="py-3 px-4">
        {entry.from && (
          <span className="text-slate-500 text-xs truncate max-w-[160px] block">{entry.from}</span>
        )}
      </td>
    </tr>
  )
}

export default function DashboardPage() {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState({ emailsDrafted: 0, conflictsCaught: 0, tasksCompleted: 0, focusMinutes: 0 })

  const loadData = async () => {
    try {
      const res = await fetch('/api/activity')
      if (!res.ok) return
      const data = await res.json()
      setActivities(data.activities || [])
      setStats(data.stats || {})
    } catch {
      // api not reachable
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const status = getStatus(activities)
  const todayActivities = activities.filter(a => {
    const d = new Date(a.timestamp)
    return d.toDateString() === new Date().toDateString()
  })
  const activeFocus = activities.find(a => a.type === 'focus_started' &&
    !activities.find(b => b.type === 'focus_ended' && b.timestamp > a.timestamp))

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Your SlugMind activity — updates every 10s</p>
        </div>
        <StatusDot status={status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Emails drafted" value={stats.emailsDrafted} iconClass="ph-envelope" color="#6366f1" />
        <SummaryCard label="Conflicts caught" value={stats.conflictsCaught} iconClass="ph-warning" color="#ef4444" />
        <SummaryCard label="Tasks completed" value={stats.tasksCompleted} iconClass="ph-check-circle" color="#22c55e" />
        <SummaryCard label="Focus time" value={formatFocusTime(stats.focusMinutes)} iconClass="ph-timer" color="#7c3aed" />
      </div>

      <div className="mb-8">
        <FocusTimer
          isActive={!!activeFocus}
          minutesRemaining={0}
          actionsCount={todayActivities.length}
        />
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
          <i className="ph ph-list-bullets" style={{ fontSize: '18px', color: '#94a3b8' }} />
          <h2 className="text-lg font-semibold text-white">Action Log</h2>
          <span className="ml-auto text-xs text-slate-500">{activities.length} entries</span>
        </div>
        {activities.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <i className="ph ph-spiral" style={{ fontSize: '48px', color: '#334155', display: 'block', margin: '0 auto 12px' }} />
            <p className="text-slate-500 text-sm">No activity yet.</p>
            <p className="text-slate-600 text-xs mt-1">Load the extension, connect Google, and SlugMind will start logging here.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700/50">
                <th className="py-2 px-4">Time</th>
                <th className="py-2 px-4">Type</th>
                <th className="py-2 px-4">Action</th>
                <th className="py-2 px-4">From</th>
              </tr>
            </thead>
            <tbody>
              {activities.slice(0, 50).map(entry => (
                <ActivityRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
