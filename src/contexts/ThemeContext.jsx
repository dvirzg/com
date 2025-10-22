import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  playfairDisplay: "'Playfair Display', Georgia, serif"
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [font, setFont] = useState('system')
  const [isLoadingFont, setIsLoadingFont] = useState(true)

  // Fetch font from database on mount
  useEffect(() => {
    const fetchFont = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('font_family')
          .eq('id', 1)
          .single()

        if (error) {
          console.error('Error fetching font settings:', error)
          setFont('system')
        } else if (data) {
          setFont(data.font_family)
        }
      } catch (err) {
        console.error('Error fetching font settings:', err)
        setFont('system')
      } finally {
        setIsLoadingFont(false)
      }
    }

    fetchFont()
  }, [])

  // Subscribe to font changes in real-time
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

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, font, setFont }}>
      {children}
    </ThemeContext.Provider>
  )
}
