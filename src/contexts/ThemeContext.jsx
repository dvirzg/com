import { createContext, useContext, useEffect, useState } from 'react'

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

  const [font, setFont] = useState(() => {
    const saved = localStorage.getItem('font')
    return saved || 'system'
  })

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
    localStorage.setItem('font', font)
  }, [font])

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, font, setFont }}>
      {children}
    </ThemeContext.Provider>
  )
}
