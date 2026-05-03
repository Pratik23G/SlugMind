'use client'

const TYPE_EMOJI = {
  email: '📧',
  calendar: '📅',
  task: '✅',
  focus: '🎯',
  default: '⚡',
}

const OUTCOME_STYLES = {
  sent: 'bg-green-500/20 text-green-400 border border-green-500/30',
  done: 'bg-green-500/20 text-green-400 border border-green-500/30',
  flagged: 'bg-red-500/20 text-red-400 border border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  active: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  default: 'bg-slate-600/30 text-slate-400 border border-slate-600/30',
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

export default function ActionLog({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🐌</div>
        <p className="text-slate-300 font-medium mb-2">No actions yet.</p>
        <p className="text-slate-500 text-sm max-w-sm">
          Load the extension and connect your Google account to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700/50">
            <th className="pb-3 pr-4 font-medium">Time</th>
            <th className="pb-3 pr-4 font-medium">Type</th>
            <th className="pb-3 pr-4 font-medium">Action</th>
            <th className="pb-3 font-medium">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry, i) => {
            const emoji = TYPE_EMOJI[entry.type] || TYPE_EMOJI.default
            const outcomeStyle = OUTCOME_STYLES[entry.outcome] || OUTCOME_STYLES.default

            return (
              <tr
                key={entry.id || i}
                className="border-b border-slate-700/30 hover:bg-slate-800 transition-colors"
              >
                <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                  {entry.timestamp ? getRelativeTime(entry.timestamp) : '—'}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-base" title={entry.type}>{emoji}</span>
                </td>
                <td className="py-3 pr-4 text-slate-300 max-w-xs truncate">
                  {entry.description || '—'}
                </td>
                <td className="py-3">
                  {entry.outcome ? (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${outcomeStyle}`}>
                      {entry.outcome}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
