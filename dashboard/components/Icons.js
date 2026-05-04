import {
  Mail, AlertTriangle, CheckCircle, Timer, Home, Settings,
  List, Brain, Calendar, Bell,
} from 'lucide-react'

export const EmailIcon = ({ size = 16, color = '#7C3AED' }) =>
  <Mail size={size} color={color} strokeWidth={1.5} />

export const ConflictIcon = ({ size = 16, color = '#F59E0B' }) =>
  <AlertTriangle size={size} color={color} strokeWidth={1.5} />

export const CheckIcon = ({ size = 16, color = '#10B981' }) =>
  <CheckCircle size={size} color={color} strokeWidth={1.5} />

export const TimerIcon = ({ size = 16, color = '#3B82F6' }) =>
  <Timer size={size} color={color} strokeWidth={1.5} />

export const HomeIcon = ({ size = 18, color = 'currentColor' }) =>
  <Home size={size} color={color} strokeWidth={1.5} />

export const SettingsIcon = ({ size = 18, color = 'currentColor' }) =>
  <Settings size={size} color={color} strokeWidth={1.5} />

export const LogIcon = ({ size = 18, color = 'currentColor' }) =>
  <List size={size} color={color} strokeWidth={1.5} />

export const BrainIcon = ({ size = 18, color = '#A855F7' }) =>
  <Brain size={size} color={color} strokeWidth={1.5} />

export const CalendarIcon = ({ size = 18, color = '#F59E0B' }) =>
  <Calendar size={size} color={color} strokeWidth={1.5} />

export const BellIcon = ({ size = 18, color = 'currentColor' }) =>
  <Bell size={size} color={color} strokeWidth={1.5} />

export const SlugMindLogo = ({ size = 24 }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    border: '2px solid #7C3AED',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}>
    <div style={{
      width: size * 0.4,
      height: size * 0.4,
      borderRadius: '50%',
      border: '1.5px solid #7C3AED',
    }} />
  </div>
)
