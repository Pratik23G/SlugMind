'use client'

import { useState, useEffect } from 'react'

const DEFAULT_SETTINGS = {
  dashboardUrl: 'http://localhost:3000',
  autoSend: false,
  trustedSenders: '',
  focusSuppressToasts: true,
  timerPresets: [25, 45],
  geminiApiKey: '',
  extensionId: '',
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-6">
      <h2 className="text-base font-semibold text-white mb-5">{title}</h2>
      {children}
    </div>
  )
}

function InputField({ label, note, children }) {
  return (
    <div className="mb-4">
      <label className="block text-slate-300 text-sm mb-1.5">{label}</label>
      {children}
      {note && <p className="text-slate-500 text-xs mt-1.5">{note}</p>}
    </div>
  )
}

const inputClass = 'bg-slate-900 border border-slate-700 rounded-lg p-2 px-3 text-white w-full focus:outline-none focus:border-indigo-500 transition-colors text-sm'

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('slugmind_settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    }
  }, [])

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updatePreset = (index, value) => {
    const presets = [...settings.timerPresets]
    presets[index] = parseInt(value) || 0
    setSettings(prev => ({ ...prev, timerPresets: presets }))
  }

  const handleSave = () => {
    try {
      localStorage.setItem('slugmind_settings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Configure SlugMind to match your workflow</p>
      </div>

      <SectionCard title="AI Settings">
        <InputField
          label="Gemini API Key"
          note="Your key is stored in .env.local on the server and never exposed to the extension"
        >
          <input
            type="password"
            className={inputClass}
            value={settings.geminiApiKey}
            onChange={e => update('geminiApiKey', e.target.value)}
            placeholder="AIza..."
          />
          <p className="text-indigo-400 text-xs mt-1.5">Get free key at aistudio.google.com</p>
        </InputField>
      </SectionCard>

      <SectionCard title="Email Automation">
        <InputField label="Auto-send emails">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-indigo-500 w-4 h-4"
              checked={settings.autoSend}
              onChange={e => update('autoSend', e.target.checked)}
            />
            <span className="text-slate-300 text-sm">Enable auto-send</span>
          </label>
          {settings.autoSend && (
            <p className="text-yellow-400 text-xs mt-2">SlugMind will send replies to trusted senders without asking</p>
          )}
        </InputField>

        <InputField
          label="Emails to auto-send to (one per line)"
          note="Only applies when auto-send is enabled"
        >
          <textarea
            className={inputClass + ' resize-none h-24'}
            value={settings.trustedSenders}
            onChange={e => update('trustedSenders', e.target.value)}
            placeholder="professor@ucsc.edu&#10;ta@ucsc.edu"
          />
        </InputField>
      </SectionCard>

      <SectionCard title="Focus Mode">
        <InputField label="Notifications">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-indigo-500 w-4 h-4"
              checked={settings.focusSuppressToasts}
              onChange={e => update('focusSuppressToasts', e.target.checked)}
            />
            <span className="text-slate-300 text-sm">Suppress notifications during focus</span>
          </label>
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Preset 1 (min)">
            <input
              type="number"
              className={inputClass}
              value={settings.timerPresets[0]}
              onChange={e => updatePreset(0, e.target.value)}
              min="1"
              max="120"
            />
          </InputField>
          <InputField label="Preset 2 (min)">
            <input
              type="number"
              className={inputClass}
              value={settings.timerPresets[1]}
              onChange={e => updatePreset(1, e.target.value)}
              min="1"
              max="120"
            />
          </InputField>
        </div>
      </SectionCard>

      <SectionCard title="Extension Setup">
        <InputField
          label="Chrome Extension ID (from chrome://extensions)"
          note="After loading the extension unpacked, copy the ID here"
        >
          <input
            type="text"
            className={inputClass}
            value={settings.extensionId}
            onChange={e => update('extensionId', e.target.value)}
            placeholder="abcdefghijklmnopqrstuvwxyz123456"
          />
        </InputField>
      </SectionCard>

      <button
        onClick={handleSave}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {saved ? 'Settings saved ✓' : 'Save Settings'}
      </button>
    </main>
  )
}
