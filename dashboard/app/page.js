'use client'

import { useState, useEffect } from 'react'
import ActionLog from '../components/ActionLog'
import StatusDot from '../components/StatusDot'
import FocusTimer from '../components/FocusTimer'

const TYPE_EMOJI = {
  email: '📧',
  calendar: '📅',
  task: '✅',
  focus: '🎯',
  default: '⚡',
}

function getRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function computeFocusTime(logs) {
  const focusLogs = logs.filter(l => l.type === 'focus' && l.duration)
  const totalMinutes = focusLogs.reduce((sum, l) => sum + (l.duration || 0), 0)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function getStatus(logs) {
  const hasFocus = logs.some(l => l.type === 'focus' && l.outcome === 'active')
  if (hasFocus) return 'purple'
  const hasFlagged = logs.some(l => l.outcome === 'flagged')
  if (hasFlagged) return 'red'
  const hasPending = logs.some(l => l.outcome === 'pending')
  if (hasPending) return 'yellow'
  return 'green'
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-5 flex flex-col gap-2 border border-slate-700/50">
      <div className="text-2xl">{icon}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [logs, setLogs] = useState([])
  const [focusSession, setFocusSession] = useState(null)

  const loadLogs = () => {
    try {
      const raw = localStorage.getItem('slugmind_actionLog')
      const parsed = raw ? JSON.parse(raw) : []
      setLogs(Array.isArray(parsed) ? parsed : [])

      const activeFocus = parsed.find(l => l.type === 'focus' && l.outcome === 'active')
      setFocusSession(activeFocus || null)
    } catch {
      setLogs([])
    }
  }

  useEffect(() => {
    loadLogs()
    const interval = setInterval(loadLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const emailCount = logs.filter(l => l.type === 'email').length
  const calendarCount = logs.filter(l => l.type === 'calendar').length
  const tasksDone = logs.filter(l => l.type === 'task' && l.outcome === 'done').length
  const focusTime = computeFocusTime(logs)
  const status = getStatus(logs)

  const todayLogs = logs.filter(l => {
    const logDate = new Date(l.timestamp)
    const now = new Date()
    return logDate.toDateString() === now.toDateString()
  })

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Your SlugMind activity overview</p>
        </div>
        <StatusDot status={status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Emails drafted" value={emailCount} icon="📧" />
        <SummaryCard label="Conflicts caught" value={calendarCount} icon="📅" />
        <SummaryCard label="Tasks completed" value={tasksDone} icon="✅" />
        <SummaryCard label="Focus time today" value={focusTime} icon="🎯" />
      </div>

      <div className="mb-8">
        <FocusTimer
          isActive={!!focusSession}
          minutesRemaining={focusSession?.minutesRemaining || 0}
          actionsCount={todayLogs.length}
        />
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Action Log</h2>
        <ActionLog logs={logs} />
      </div>
    </main>
  )
}
