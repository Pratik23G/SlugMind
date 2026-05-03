'use client'

export default function FocusTimer({ isActive = false, minutesRemaining = 0, actionsCount = 0 }) {
  if (isActive) {
    const hours = Math.floor(minutesRemaining / 60)
    const mins = minutesRemaining % 60
    const display = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

    return (
      <div className="bg-purple-900/30 border border-purple-700/40 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl">🎯</div>
          <div>
            <div className="text-purple-300 font-semibold text-sm uppercase tracking-wide mb-0.5">Focus Mode Active</div>
            <div className="text-white text-2xl font-bold">{display} remaining</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-xs mb-0.5">Actions today</div>
          <div className="text-purple-300 text-xl font-bold">{actionsCount}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 flex items-center gap-4">
      <div className="text-2xl opacity-50">🎯</div>
      <div>
        <div className="text-slate-400 text-sm font-medium">No active focus session</div>
        <div className="text-slate-600 text-xs mt-0.5">Start a focus timer from the SlugMind extension to begin tracking</div>
      </div>
      {actionsCount > 0 && (
        <div className="ml-auto text-right">
          <div className="text-slate-500 text-xs">Actions today</div>
          <div className="text-slate-300 text-lg font-semibold">{actionsCount}</div>
        </div>
      )}
    </div>
  )
}
