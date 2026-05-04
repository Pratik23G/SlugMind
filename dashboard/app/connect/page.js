'use client'

import { useState, useEffect } from 'react'
import { SlugMindLogo, EmailIcon, TimerIcon, CheckIcon, ConflictIcon } from '../../components/Icons'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

export default function ConnectPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(data => setStats(data.stats))
      .catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', fontFamily: FONT }}>
      {/* Logo + headline */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <SlugMindLogo size={56} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: FONT }}>
          SlugMind
        </h1>
        <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0, fontFamily: FONT }}>
          Your ambient AI co-pilot
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Emails drafted',   val: stats.emailsDrafted,   Icon: EmailIcon,    color: '#7C3AED' },
            { label: 'Conflicts caught', val: stats.conflictsCaught, Icon: ConflictIcon, color: '#F59E0B' },
            { label: 'Tasks completed',  val: stats.tasksCompleted,  Icon: CheckIcon,    color: '#10B981' },
            { label: 'Focus minutes',    val: stats.focusMinutes,    Icon: TimerIcon,    color: '#3B82F6' },
          ].map(({ label, val, Icon, color }) => (
            <div key={label} style={{
              background: '#0F1117',
              border: '1px solid #1F2937',
              borderLeft: `3px solid ${color}`,
              borderRadius: 10,
              padding: '14px 16px',
            }}>
              <Icon size={18} color={color} />
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '6px 0 2px', fontFamily: FONT }}>
                {val ?? '—'}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: FONT }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{
        background: '#0F1117',
        border: '1px solid #1F2937',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 8px', fontFamily: FONT }}>
          Install the Chrome extension
        </h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px', lineHeight: 1.6, fontFamily: FONT }}>
          The Chrome extension is required for email drafting, calendar conflict detection, and focus mode.
          Install it on your desktop browser to get started.
        </p>
        <div style={{
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: '#A855F7',
          fontFamily: FONT,
        }}>
          Chrome extension · Desktop only
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#374151', fontFamily: FONT }}>
        Dashboard works on any device · Extension requires Chrome on desktop
      </p>
    </div>
  )
}
