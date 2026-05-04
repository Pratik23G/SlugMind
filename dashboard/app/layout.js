import './globals.css'
import Sidebar from '../components/Sidebar'

export const metadata = {
  title: 'SlugMind Dashboard',
  description: 'SlugMind co-pilot dashboard — monitor AI actions, manage focus sessions, and configure automation.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SlugMind" />
      </head>
      <body style={{
        background: '#0A0B14',
        color: '#F1F5F9',
        margin: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main className="main-content" style={{
            flex: 1,
            minHeight: '100vh',
            background: '#0D0E1A',
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
