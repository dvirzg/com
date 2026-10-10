import { lazy, Suspense, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const Admin = lazy(() => import('./Admin.jsx'))

function App() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setIsDark(next)
  }

  const themeButton = (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-6 z-10 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )

  // Hidden admin page, only reachable by URL
  if (window.location.pathname.replace(/\/$/, '') === '/admin') {
    return (
      <Suspense fallback={null}>
        {themeButton}
        <Admin />
      </Suspense>
    )
  }

  return (
    <main className="h-dvh flex flex-col items-center justify-center px-6 bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
      {themeButton}

      <div className="fade-in text-center max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">Hi, I'm Dvir</h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 mb-6">Welcome.</p>
        <img
          src="/pulses.gif"
          alt="Wave interference animation"
          className="mx-auto h-10 object-contain mix-blend-darken dark:mix-blend-normal dark:invert"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
    </main>
  )
}

export default App
