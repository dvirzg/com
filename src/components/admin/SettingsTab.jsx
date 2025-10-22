import { useTheme } from '../../contexts/ThemeContext'

const FONT_OPTIONS = [
  { value: 'system', label: 'System Default' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'garamond', label: 'Garamond' },
  { value: 'canela', label: 'Canela' },
  { value: 'geist', label: 'Geist' },
  { value: 'inter', label: 'Inter' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'clashDisplay', label: 'Clash Display' },
  { value: 'playfairDisplay', label: 'Playfair Display' }
]

const SettingsTab = () => {
  const { font, setFont } = useTheme()

  return (
    <div className="space-y-8">
      {/* Font Settings Section */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          Font Family
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Choose the font family for the entire website
        </p>

        <div className="max-w-xs">
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab
