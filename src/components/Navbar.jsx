import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const Navbar = () => {
  const { user, signOut, isAdmin, getFirstName } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const [hoveredTab, setHoveredTab] = useState(null)

  const tabs = [
    { name: 'Notes', path: '/notes' },
    { name: 'About', path: '/about' },
  ]

  if (isAdmin()) {
    tabs.push({ name: 'Sublinks', path: '/sublinks' })
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/80 border-b border-zinc-200/50 dark:border-zinc-800/30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-lg font-medium hover:opacity-70 transition-opacity"
          >
            dvirzg
          </Link>

          <div className="flex gap-1 relative">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative px-4 py-2 text-sm font-medium transition-colors"
                onMouseEnter={() => setHoveredTab(tab.path)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                {hoveredTab === tab.path && (
                  <motion.div
                    layoutId="hover-pill"
                    className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-800/60 rounded-lg backdrop-blur-sm z-10"
                    transition={{ type: 'spring', duration: 0.15, bounce: 0 }}
                  />
                )}
                {isActive(tab.path) && (
                  <motion.div
                    layoutId="active-underline"
                    className="absolute bottom-0 left-0 h-0.5 bg-white z-20"
                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                    style={{ width: '100%' }}
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
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
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
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 rounded-lg transition-opacity"
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
