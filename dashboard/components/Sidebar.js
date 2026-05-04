'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HomeIcon, SettingsIcon, SlugMindLogo } from './Icons'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

const NAV = [
  { href: '/', label: 'Dashboard', Icon: HomeIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
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
      fontFamily: FONT,
    }}>
      {/* Logo */}
      <div style={{
        padding: '22px 24px 18px',
        borderBottom: '1px solid #1F2937',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <SlugMindLogo size={24} />
        <span style={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.3px', fontFamily: FONT }}>
          SlugMind
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 12px' }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const iconColor = active ? '#A855F7' : '#6B7280'
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: FONT,
                borderLeft: active ? '3px solid #7C3AED' : '3px solid transparent',
                background: active ? 'rgba(124,58,237,0.1)' : 'transparent',
                color: active ? '#A855F7' : '#9CA3AF',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon color={iconColor} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #1F2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <span style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: '#10B981',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
            {email || 'Google Connected'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#374151', fontFamily: FONT }}>v1.0.0</div>
      </div>
    </aside>
  )
}
