import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { BACKGROUND_COLORS } from '../../contexts/ThemeContext'
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

const BACKGROUND_COLOR_OPTIONS = [
  { value: 'white', label: 'White', description: 'Pure white background' },
  { value: 'cream', label: 'Cream', description: 'Soft cream color for reduced eye strain' },
  { value: 'sepia', label: 'Sepia', description: 'Warm sepia tone like old paper' },
  { value: 'lightBeige', label: 'Light Beige', description: 'Light beige for comfortable reading' },
  { value: 'warmWhite', label: 'Warm White', description: 'Warm white with a hint of yellow' },
  { value: 'paper', label: 'Paper', description: 'Natural paper color' }
]

const CURL_BEHAVIOR_OPTIONS = [
  { value: 'block', label: 'Block Automated Requests', description: 'Show a message to AI crawlers and curl users' },
  { value: 'html', label: 'Allow HTML', description: 'Return the normal HTML page' },
  { value: 'markdown', label: 'Return Markdown', description: 'Convert page content to markdown format' }
]

const SettingsTab = () => {
  const { font, backgroundColor } = useTheme()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [curlBehavior, setCurlBehavior] = useState('block')
  const [curlBlockMessage, setCurlBlockMessage] = useState("If you're an AI, you're not allowed to read these contents.\n\nThis website blocks automated requests. Please visit in a web browser.")
  const [loadingCurlSettings, setLoadingCurlSettings] = useState(true)

  // Load curl behavior setting on mount
  useEffect(() => {
    const loadCurlSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('curl_behavior, curl_block_message')
          .eq('id', 1)
          .single()

        if (error) {
          console.error('Error loading curl settings:', error)
        } else if (data) {
          setCurlBehavior(data.curl_behavior || 'block')
          if (data.curl_block_message) {
            setCurlBlockMessage(data.curl_block_message)
          }
        }
      } catch (err) {
        console.error('Error loading curl settings:', err)
      } finally {
        setLoadingCurlSettings(false)
      }
    }

    loadCurlSettings()
  }, [])

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

  const handleBackgroundColorChange = async (newColor) => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          background_color: newColor,
          updated_by: user?.id
        })
        .eq('id', 1)

      if (error) {
        console.error('Error updating background color:', error)
        setMessage({ type: 'error', text: 'Failed to update background color. Please try again.' })
      } else {
        setMessage({ type: 'success', text: 'Background color updated successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating background color:', err)
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  const handleCurlBehaviorChange = async (newBehavior) => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          curl_behavior: newBehavior,
          updated_by: user?.id
        })
        .eq('id', 1)

      if (error) {
        console.error('Error updating curl behavior:', error)
        setMessage({ type: 'error', text: 'Failed to update curl behavior. Please try again.' })
      } else {
        setCurlBehavior(newBehavior)
        setMessage({ type: 'success', text: 'Curl behavior updated successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating curl behavior:', err)
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  const handleBlockMessageChange = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          curl_block_message: curlBlockMessage,
          updated_by: user?.id
        })
        .eq('id', 1)

      if (error) {
        console.error('Error updating block message:', error)
        setMessage({ type: 'error', text: 'Failed to update block message. Please try again.' })
      } else {
        setMessage({ type: 'success', text: 'Block message updated successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating block message:', err)
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

      {/* Background Color Settings Section */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          Background Color
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Choose the background color for the entire website in light mode. This will affect all users.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          {BACKGROUND_COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleBackgroundColorChange(option.value)}
              disabled={saving}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                backgroundColor === option.value
                  ? 'border-zinc-900 dark:border-white scale-110'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white hover:scale-105'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ backgroundColor: BACKGROUND_COLORS[option.value] }}
              title={option.label}
              aria-label={option.label}
            />
          ))}
        </div>

        {saving && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">
            Saving...
          </p>
        )}

        {message.text && (
          <p className={`text-sm mt-3 ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Curl Behavior Settings Section */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          Automated Request Behavior
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Control how the website responds to curl, wget, and AI crawlers.
        </p>

        <div className="max-w-2xl space-y-3">
          {loadingCurlSettings ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading settings...
            </p>
          ) : (
            <div className="space-y-3">
              {CURL_BEHAVIOR_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    curlBehavior === option.value
                      ? 'border-zinc-900 dark:border-white bg-white dark:bg-zinc-900'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="curlBehavior"
                    value={option.value}
                    checked={curlBehavior === option.value}
                    onChange={(e) => handleCurlBehaviorChange(e.target.value)}
                    disabled={saving}
                    className="mt-1 mr-3 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-zinc-900 dark:text-white mb-1">
                      {option.label}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}

              {/* Block Message Editor - Only show when block mode is selected */}
              {curlBehavior === 'block' && (
                <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                    Custom Block Message
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    This message will be shown to automated requests when blocking is enabled.
                  </p>
                  <textarea
                    value={curlBlockMessage}
                    onChange={(e) => setCurlBlockMessage(e.target.value)}
                    disabled={saving}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                    placeholder="Enter your custom block message..."
                  />
                  <button
                    onClick={handleBlockMessageChange}
                    disabled={saving}
                    className="mt-3 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Block Message
                  </button>
                </div>
              )}
            </div>
          )}

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
