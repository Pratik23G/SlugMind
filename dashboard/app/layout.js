import './globals.css'
import Sidebar from '../components/Sidebar'

export const metadata = {
  title: 'SlugMind Dashboard',
  description: 'SlugMind co-pilot dashboard — monitor AI actions, manage focus sessions, and configure automation.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        background: '#0A0B14',
        color: '#F1F5F9',
        margin: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{
            flex: 1,
            marginLeft: 240,
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
