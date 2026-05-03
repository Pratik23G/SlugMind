'use client'

const BUCKET_CONFIG = {
  today: {
    label: 'Today',
    headerClass: 'text-blue-400',
    dotClass: 'bg-blue-500',
  },
  needs_attention: {
    label: 'Needs Attention',
    headerClass: 'text-red-400',
    dotClass: 'bg-red-500',
  },
  tomorrow: {
    label: 'Tomorrow',
    headerClass: 'text-slate-400',
    dotClass: 'bg-slate-500',
  },
}

const BUCKET_ORDER = ['needs_attention', 'today', 'tomorrow']

export default function TodoList({ tasks = [] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-slate-500 text-sm">No tasks yet.</p>
      </div>
    )
  }

  const grouped = tasks.reduce((acc, task) => {
    const bucket = task.bucket || 'today'
    if (!acc[bucket]) acc[bucket] = []
    acc[bucket].push(task)
    return acc
  }, {})

  const bucketsPresent = BUCKET_ORDER.filter(b => grouped[b] && grouped[b].length > 0)

  const extraBuckets = Object.keys(grouped).filter(b => !BUCKET_ORDER.includes(b))

  return (
    <div className="space-y-6">
      {[...bucketsPresent, ...extraBuckets].map(bucket => {
        const config = BUCKET_CONFIG[bucket] || {
          label: bucket,
          headerClass: 'text-slate-400',
          dotClass: 'bg-slate-500',
        }
        const bucketTasks = grouped[bucket] || []

        return (
          <div key={bucket}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-block w-2 h-2 rounded-full ${config.dotClass}`} />
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${config.headerClass}`}>
                {config.label}
              </h3>
              <span className="text-slate-600 text-xs">({bucketTasks.length})</span>
            </div>

            <div className="space-y-2">
              {bucketTasks.map((task, i) => (
                <div
                  key={task.id || i}
                  className="flex items-start gap-3 bg-slate-800/40 rounded-lg px-4 py-3 border border-slate-700/30"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={task.completed || false}
                    className="mt-0.5 accent-indigo-500 w-4 h-4 cursor-default"
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}
                    >
                      {task.title || 'Untitled task'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${config.headerClass} bg-slate-700/40`}>
                    {config.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
