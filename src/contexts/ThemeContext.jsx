import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BACKGROUND_COLORS } from '../constants/colors'

const ThemeContext = createContext({})

export const useTheme = () => useContext(ThemeContext)

const FONT_FAMILIES = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  garamond: "Garamond, 'Garamond MT', Bookman, 'Bookman Old Style', serif",
  canela: "Canela, Georgia, serif",
  geist: "Geist, system-ui, sans-serif",
  inter: "Inter, system-ui, sans-serif",
  montserrat: "Montserrat, system-ui, sans-serif",
  clashDisplay: "'Clash Display', Impact, sans-serif",
  playfairDisplay: "'Playfair Display', Georgia, serif",
  besley: "Besley, Georgia, serif"
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
          console.error('Error fetching settings:', error)
          setFont('system')
          setBackgroundColor('white')
        } else if (data) {
          setFont(data.font_family)
          setBackgroundColor(data.background_color || 'white')
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
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
