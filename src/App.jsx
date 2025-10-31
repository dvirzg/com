import { lazy, Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { NotesProvider } from './contexts/NotesContext'
import { BACKGROUND_COLORS } from './constants/colors'
import Navbar from './components/Navbar'
import AppRouter from './components/AppRouter'

// Lazy load Analytics to avoid blocking initial render
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then(module => ({ default: module.Analytics }))
)

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}

function AppContent() {
  const { isDark, backgroundColor } = useTheme()

  const bgColor = isDark
    ? '#000000'
    : BACKGROUND_COLORS[backgroundColor] || BACKGROUND_COLORS.white

  return (
    <div
      className="min-h-screen text-zinc-900 dark:text-white transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      <Navbar />
      <AppRouter />
    </div>
  )
}

export default App
