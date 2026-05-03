'use client'

const STATUS_CONFIG = {
  green: {
    label: 'All clear',
    dot: 'bg-green-500',
    pulse: 'bg-green-500',
    text: 'text-green-400',
  },
  yellow: {
    label: 'Actions queued',
    dot: 'bg-yellow-500',
    pulse: 'bg-yellow-500',
    text: 'text-yellow-400',
  },
  red: {
    label: 'Needs attention',
    dot: 'bg-red-500',
    pulse: 'bg-red-500',
    text: 'text-red-400',
  },
  purple: {
    label: 'Focus mode',
    dot: 'bg-purple-500',
    pulse: 'bg-purple-500',
    text: 'text-purple-400',
  },
}

export default function StatusDot({ status = 'green' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.green

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-3 h-3">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${config.pulse}`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
      </div>
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </div>
  )
}
