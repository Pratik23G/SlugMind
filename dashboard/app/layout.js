import './globals.css'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

export const metadata = {
  title: 'SlugMind Dashboard',
  description: 'SlugMind co-pilot dashboard for UCSC students — monitor AI actions, manage focus sessions, and configure automation.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="beforeInteractive" />
      </head>
      <body className={inter.className} style={{ background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
          <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ph ph-spiral" style={{ fontSize: '22px', color: '#6366f1' }}></i>
            SlugMind
          </span>
          <nav style={{ display: 'flex', gap: '20px' }}>
            <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph ph-house" style={{ fontSize: '16px' }}></i> Dashboard
            </Link>
            <Link href="/settings" className="text-slate-400 hover:text-white text-sm transition-colors" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph ph-gear" style={{ fontSize: '16px' }}></i> Settings
            </Link>
          </nav>
        </div>
        {children}
      </body>
    </html>
  )
}
