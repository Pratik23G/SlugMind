'use client'

import { useState, useEffect } from 'react'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const DEFAULT_SETTINGS = {
  userEmail: '',
  dashboardUrl: 'https://slug-mind.vercel.app',
  autoSend: false,
  trustedSenders: '',
  focusSuppressToasts: true,
  timerPresets: [25, 45],
  geminiApiKey: '',
  extensionId: '',
}

const inputBase = {
  background: '#0A0B14',
  border: '1.5px solid #1F2937',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#F1F5F9',
  width: '100%',
  fontSize: 14,
  outline: 'none',
  fontFamily: FONT,
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

function SectionCard({ title, color, children }) {
  return (
    <div style={{
      background: '#0F1117',
      border: '1px solid #1F2937',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      <div style={{ height: 3, background: color }} />
      <div style={{ padding: '20px 24px' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#fff' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function Field({ label, note, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', color: '#CBD5E1', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
      {note && <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 12 }}>{note}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22,
          borderRadius: 11,
          background: checked ? '#7C3AED' : '#1F2937',
          position: 'relative',
          transition: 'background 0.2s',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3, left: checked ? 21 : 3,
          width: 16, height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ color: '#CBD5E1', fontSize: 14 }}>{label}</span>
    </label>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'ok' | 'fail'
  const [keyError, setKeyError] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('slugmind_settings')
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) })
    } catch { setSettings(DEFAULT_SETTINGS) }
  }, [])

  const update = (key, value) => setSettings(p => ({ ...p, [key]: value }))

  const updatePreset = (i, v) => {
    const p = [...settings.timerPresets]
    p[i] = parseInt(v) || 0
    setSettings(prev => ({ ...prev, timerPresets: p }))
  }

  const handleGeminiChange = (v) => {
    update('geminiApiKey', v)
    setKeyError(v.length > 0 && !v.startsWith('AIza'))
    setTestStatus(null)
  }

  const handleSave = () => {
    try {
      localStorage.setItem('slugmind_settings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
  }

  const testConnection = async () => {
    setTestStatus('testing')
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Say OK', systemPrompt: 'Reply with just: OK' }),
      })
      setTestStatus(res.ok ? 'ok' : 'fail')
    } catch {
      setTestStatus('fail')
    }
    setTimeout(() => setTestStatus(null), 4000)
  }

  const testBtnStyle = {
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT,
    whiteSpace: 'nowrap',
    background:
      testStatus === 'ok' ? '#059669' :
      testStatus === 'fail' ? '#DC2626' :
      '#1E293B',
    color:
      testStatus === 'ok' || testStatus === 'fail' ? '#fff' : '#9CA3AF',
    border: '1px solid #374151',
    transition: 'all 0.2s',
    flexShrink: 0,
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Settings</h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Configure SlugMind to match your workflow</p>
      </div>

      {/* AI Settings */}
      <SectionCard title="AI Settings" color="#7C3AED">
        <Field
          label="Gemini API Key"
          note="Your key is stored in .env.local on the server and never exposed to the extension"
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              style={{ ...inputBase, borderColor: keyError ? '#EF4444' : '#1F2937', flex: 1 }}
              value={settings.geminiApiKey}
              onChange={e => handleGeminiChange(e.target.value)}
              placeholder="AIza..."
              onFocus={e => { if (!keyError) e.target.style.borderColor = '#7C3AED' }}
              onBlur={e => { e.target.style.borderColor = keyError ? '#EF4444' : '#1F2937' }}
            />
            <button onClick={testConnection} disabled={testStatus === 'testing'} style={testBtnStyle}>
              {testStatus === 'testing' ? '…' :
               testStatus === 'ok' ? '✓ Connected' :
               testStatus === 'fail' ? '✗ Failed' :
               'Test Connection'}
            </button>
          </div>
          {keyError && (
            <p style={{ color: '#EF4444', fontSize: 12, margin: '5px 0 0' }}>
              Gemini API keys start with "AIza"
            </p>
          )}
          <p style={{ color: '#7C3AED', fontSize: 12, margin: '6px 0 0' }}>
            Get a free key at aistudio.google.com
          </p>
        </Field>
      </SectionCard>

      {/* Email Automation */}
      <SectionCard title="Email Automation" color="#3B82F6">
        <Field label="Auto-send emails">
          <Toggle
            checked={settings.autoSend}
            onChange={v => update('autoSend', v)}
            label="Enable auto-send"
          />
          {settings.autoSend && (
            <p style={{ color: '#F59E0B', fontSize: 12, margin: '8px 0 0' }}>
              SlugMind will send replies to trusted senders without asking
            </p>
          )}
        </Field>
        <Field
          label="Auto-send to (one per line)"
          note="Only applies when auto-send is enabled"
        >
          <textarea
            style={{ ...inputBase, resize: 'vertical', minHeight: 88, lineHeight: 1.6 }}
            value={settings.trustedSenders}
            onChange={e => update('trustedSenders', e.target.value)}
            placeholder={'professor@ucsc.edu\nta@ucsc.edu'}
            onFocus={e => e.target.style.borderColor = '#3B82F6'}
            onBlur={e => e.target.style.borderColor = '#1F2937'}
          />
        </Field>
      </SectionCard>

      {/* Focus Mode */}
      <SectionCard title="Focus Mode" color="#F59E0B">
        <Field label="Notifications">
          <Toggle
            checked={settings.focusSuppressToasts}
            onChange={v => update('focusSuppressToasts', v)}
            label="Suppress notifications during focus"
          />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Preset 1 (min)">
            <input
              type="number"
              style={inputBase}
              value={settings.timerPresets[0]}
              onChange={e => updatePreset(0, e.target.value)}
              min="1" max="120"
              onFocus={e => e.target.style.borderColor = '#F59E0B'}
              onBlur={e => e.target.style.borderColor = '#1F2937'}
            />
          </Field>
          <Field label="Preset 2 (min)">
            <input
              type="number"
              style={inputBase}
              value={settings.timerPresets[1]}
              onChange={e => updatePreset(1, e.target.value)}
              min="1" max="120"
              onFocus={e => e.target.style.borderColor = '#F59E0B'}
              onBlur={e => e.target.style.borderColor = '#1F2937'}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Extension Setup */}
      <SectionCard title="Extension Setup" color="#10B981">
        <Field
          label="Connected Account Email"
          note="Displayed in the sidebar — update after connecting Google"
        >
          <input
            type="email"
            style={inputBase}
            value={settings.userEmail}
            onChange={e => update('userEmail', e.target.value)}
            placeholder="you@gmail.com"
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = '#1F2937'}
          />
        </Field>
        <Field
          label="Dashboard URL"
          note="The deployed Vercel URL or localhost for local dev"
        >
          <input
            type="url"
            style={inputBase}
            value={settings.dashboardUrl}
            onChange={e => update('dashboardUrl', e.target.value)}
            placeholder="https://slug-mind.vercel.app"
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = '#1F2937'}
          />
        </Field>
        <Field
          label="Chrome Extension ID"
          note="Copy from chrome://extensions after loading the extension"
        >
          <input
            type="text"
            style={inputBase}
            value={settings.extensionId}
            onChange={e => update('extensionId', e.target.value)}
            placeholder="abcdefghijklmnopqrstuvwxyz123456"
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = '#1F2937'}
          />
        </Field>
      </SectionCard>

      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '13px',
          background: saved ? '#059669' : '#7C3AED',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: FONT,
          transition: 'background 0.25s ease',
        }}
      >
        {saved ? 'Saved ✓' : 'Save Settings'}
      </button>
    </div>
  )
}
