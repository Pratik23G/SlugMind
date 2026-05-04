'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('slugmind_settings') || '{}')
      setEmail(s.userEmail || '')
    } catch {}
  }, [])

  return (
    <aside style={{
      width: 240,
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      background: '#0A0B14',
      borderRight: '1px solid #1F2937',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid #1F2937',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 24, lineHeight: 1, color: '#7C3AED' }}>⊙</span>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>SlugMind</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {NAV.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 4,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderLeft: active ? '3px solid #7C3AED' : '3px solid transparent',
                background: active ? 'rgba(124,58,237,0.1)' : 'transparent',
                color: active ? '#A855F7' : '#9CA3AF',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1F2937',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <span style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#10B981',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 11,
            color: '#6B7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {email || 'Google Connected'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#374151' }}>v1.0.0</div>
      </div>
    </aside>
  )
}
