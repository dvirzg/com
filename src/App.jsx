import { lazy, Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { NotesProvider } from './contexts/NotesContext'
import { ToastProvider } from './contexts/ToastContext'
import { BACKGROUND_COLORS } from './constants/colors'
import Navbar from './components/Navbar'
import AppRouter from './components/AppRouter'
import ErrorBoundary from './components/ErrorBoundary'
import TweetsOverlay from './components/TweetsOverlay'
import { useLocation } from 'react-router-dom'

// Lazy load Analytics to avoid blocking initial render
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then(module => ({ default: module.Analytics }))
)

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotesProvider>
              <BrowserRouter>
                <AppContent />
                <Suspense fallback={null}>
                  <Analytics />
                </Suspense>
              </BrowserRouter>
            </NotesProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function AppContent() {
  const { isDark, backgroundColor } = useTheme()
  const location = useLocation()

  const bgColor = isDark
    ? '#000000'
    : BACKGROUND_COLORS[backgroundColor] || BACKGROUND_COLORS.white
    
  // Hide overlay on Notes and Career pages
  const showOverlay = !['/notes', '/career'].some(path => location.pathname.startsWith(path))

  return (
    <div
      className="min-h-screen text-zinc-900 dark:text-white transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      <Navbar />
      <AppRouter />
      {showOverlay && <TweetsOverlay />}
    </div>
  )
}

export default App
