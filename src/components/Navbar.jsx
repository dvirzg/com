import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { BACKGROUND_COLORS } from '../constants/colors'
import { supabase } from '../lib/supabase'

const Navbar = () => {
  const { user, signOut, isAdmin, getFirstName } = useAuth()
  const { isDark, toggleTheme, backgroundColor } = useTheme()
  const location = useLocation()
  const [hoveredTab, setHoveredTab] = useState(null)
  const [customPages, setCustomPages] = useState([])
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    loadCustomPages()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show navbar when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const loadCustomPages = async () => {
    const { data } = await supabase
      .from('pages')
      .select('slug, title, nav_order')
      .eq('show_in_nav', true)
      .order('nav_order', { ascending: true })

    if (data) {
      setCustomPages(data)
    }
  }

  const tabs = [
    { name: 'Notes', path: '/notes' },
    { name: 'Career', path: '/career' },
  ]

  if (isAdmin()) {
    tabs.push({ name: 'Drafts', path: '/drafts' })
  }

  // Add custom pages to tabs
  customPages.forEach((page) => {
    tabs.push({ name: page.title, path: `/${page.slug}` })
  })

  if (isAdmin()) {
    tabs.push({ name: 'Admin', path: '/admin' })
  }

  const isActive = (path) => location.pathname === path

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault()
      // Find the home page container and scroll it to the top
      const homeContainer = document.querySelector('.h-screen.overflow-y-scroll')
      if (homeContainer) {
        homeContainer.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // Fallback to window scroll
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const bgColor = isDark
    ? 'rgba(0, 0, 0, 0.8)'
    : `${BACKGROUND_COLORS[backgroundColor] || BACKGROUND_COLORS.white}B3` // B3 = 70% opacity in hex

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/30 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-lg font-medium hover:opacity-70 transition-opacity"
            onClick={handleLogoClick}
          >
            Hi, {getFirstName()}
          </Link>

          <div className="flex gap-1 relative" onMouseLeave={() => setHoveredTab(null)}>
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative px-4 py-2 text-sm font-medium transition-colors"
                onMouseEnter={() => setHoveredTab(tab.path)}
              >
                {hoveredTab === tab.path && (
                  <motion.div
                    layoutId="hover-pill"
                    className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-800 rounded-lg backdrop-blur-sm z-10"
                    transition={{ type: 'spring', duration: 0.15, bounce: 0 }}
                  />
                )}
                {isActive(tab.path) && (
                  <motion.div
                    layoutId="active-underline"
                    className="absolute bottom-0 left-0 h-0.5 bg-zinc-900 dark:bg-white z-20"
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
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
