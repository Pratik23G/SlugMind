import { NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json')
const STATS_FILE = path.join(DATA_DIR, 'stats.json')

async function readJSON(file, fallback) {
  try {
    const raw = await readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJSON(file, data) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(file, JSON.stringify(data, null, 2))
}

export async function GET() {
  const activities = await readJSON(ACTIVITY_FILE, [])
  const stats = await readJSON(STATS_FILE, {
    emailsDrafted: 0,
    conflictsCaught: 0,
    tasksCompleted: 0,
    focusMinutes: 0,
  })
  const sorted = [...activities].sort((a, b) => b.timestamp - a.timestamp)
  return NextResponse.json({ activities: sorted, stats })
}

export async function POST(request) {
  const body = await request.json()

  const activities = await readJSON(ACTIVITY_FILE, [])
  const stats = await readJSON(STATS_FILE, {
    emailsDrafted: 0,
    conflictsCaught: 0,
    tasksCompleted: 0,
    focusMinutes: 0,
  })

  const entry = { id: crypto.randomUUID(), ...body, timestamp: body.timestamp || Date.now() }
  activities.push(entry)

  // keep last 500 entries
  const trimmed = activities.slice(-500)
  await writeJSON(ACTIVITY_FILE, trimmed)

  if (body.type === 'email_drafted') stats.emailsDrafted += 1
  if (body.type === 'conflict_detected') stats.conflictsCaught += 1
  if (body.type === 'task_completed') stats.tasksCompleted += 1
  if (body.type === 'focus_ended' && body.duration) {
    stats.focusMinutes += Math.round(body.duration)
  }

  await writeJSON(STATS_FILE, stats)

  return NextResponse.json({ ok: true, id: entry.id })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
