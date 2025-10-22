import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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
  const { font } = useTheme()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleFontChange = async (newFont) => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          font_family: newFont,
          updated_by: user?.id
        })
        .eq('id', 1)

      if (error) {
        console.error('Error updating font:', error)
        setMessage({ type: 'error', text: 'Failed to update font. Please try again.' })
      } else {
        setMessage({ type: 'success', text: 'Font updated successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating font:', err)
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Font Settings Section */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          Font Family
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Choose the font family for the entire website. This will affect all users.
        </p>

        <div className="max-w-xs space-y-3">
          <select
            value={font}
            onChange={(e) => handleFontChange(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {saving && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Saving...
            </p>
          )}

          {message.text && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsTab
