import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BACKGROUND_COLORS } from '../constants/colors'
import { logger } from '../lib/logger'

const ThemeContext = createContext({})

export const useTheme = () => useContext(ThemeContext)

const FONT_FAMILIES = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  georgia: "Georgia, serif",
  garamond: "Garamond, serif",
  canela: "'Cormorant Garamond', serif",
  geist: "'Geist', sans-serif",
  inter: "'Inter', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  clashDisplay: "'Bebas Neue', sans-serif",
  playfairDisplay: "'Playfair Display', serif",
  ddin: "'IBM Plex Sans Condensed', sans-serif",
  besley: "'Besley', serif",
  sourceSerif4: "'Source Serif 4', serif",
  cmuSerif: "'CMU Serif', serif"
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [font, setFont] = useState('system')
  const [backgroundColor, setBackgroundColor] = useState('white')
  const [isLoadingFont, setIsLoadingFont] = useState(true)

  // Fetch font and background color from database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('font_family, background_color')
          .eq('id', 1)
          .single()

        if (error) {
          logger.error('Error fetching settings:', error)
          setFont('system')
          setBackgroundColor('white')
        } else if (data) {
          setFont(data.font_family)
          setBackgroundColor(data.background_color || 'white')
        }
      } catch (err) {
        logger.error('Error fetching settings:', err)
        setFont('system')
        setBackgroundColor('white')
      } finally {
        setIsLoadingFont(false)
      }
    }

    fetchSettings()
  }, [])

  // Subscribe to settings changes in real-time
  useEffect(() => {
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.1'
        },
        (payload) => {
          if (payload.new?.font_family) {
            setFont(payload.new.font_family)
          }
          if (payload.new?.background_color) {
            setBackgroundColor(payload.new.background_color)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', FONT_FAMILIES[font])
  }, [font])

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-color', BACKGROUND_COLORS[backgroundColor] || BACKGROUND_COLORS.white)
  }, [backgroundColor])

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, font, setFont, backgroundColor, setBackgroundColor }}>
      {children}
    </ThemeContext.Provider>
  )
}
