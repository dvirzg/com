import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const Navbar = () => {
  const { user, signOut, isAdmin } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  const tabs = [
    { name: 'Notes', path: '/notes' },
    { name: 'About', path: '/about' },
  ]

  if (isAdmin()) {
    tabs.push({ name: 'Sublinks', path: '/sublinks' })
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-lg font-medium hover:opacity-70 transition-opacity"
          >
            Hi, {user ? user.user_metadata?.name || 'Guest' : 'Guest'}
          </Link>

          <div className="flex gap-1 relative">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative px-4 py-2 text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {isActive(tab.path) && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-lg backdrop-blur-sm"
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                  />
                )}
                <span className="relative z-10">{tab.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
