import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { BACKGROUND_COLORS } from '../../constants/colors'
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
  { value: 'playfairDisplay', label: 'Playfair Display' },
  { value: 'ddin', label: 'D-DIN' },
  { value: 'besley', label: 'Besley' },
  { value: 'sourceSerif4', label: 'Source Serif 4' },
  { value: 'cmuSerif', label: 'CMU Serif' }
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
  const { font, backgroundColor, setBackgroundColor } = useTheme()
  const { user } = useAuth()

  // Separate state for each section
  const [fontSaving, setFontSaving] = useState(false)
  const [fontMessage, setFontMessage] = useState({ type: '', text: '' })

  const [bgSaving, setBgSaving] = useState(false)
  const [bgMessage, setBgMessage] = useState({ type: '', text: '' })

  const [curlSaving, setCurlSaving] = useState(false)
  const [curlMessage, setCurlMessage] = useState({ type: '', text: '' })

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
    setFontSaving(true)
    setFontMessage({ type: '', text: '' })

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
        setFontMessage({ type: 'error', text: 'Failed to update font. Please try again.' })
      } else {
        setFontMessage({ type: 'success', text: 'Font updated successfully!' })
        setTimeout(() => setFontMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating font:', err)
      setFontMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setFontSaving(false)
    }
  }

  const handleBackgroundColorChange = async (newColor) => {
    setBgSaving(true)
    setBgMessage({ type: '', text: '' })

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
        setBgMessage({ type: 'error', text: 'Failed to update background color. Please try again.' })
      } else {
        // Manually update the local state immediately
        setBackgroundColor(newColor)
        setBgMessage({ type: 'success', text: 'Background color updated successfully!' })
        setTimeout(() => setBgMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating background color:', err)
      setBgMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setBgSaving(false)
    }
  }

  const handleCurlBehaviorChange = async (newBehavior) => {
    setCurlSaving(true)
    setCurlMessage({ type: '', text: '' })

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
        setCurlMessage({ type: 'error', text: 'Failed to update curl behavior. Please try again.' })
      } else {
        setCurlBehavior(newBehavior)
        setCurlMessage({ type: 'success', text: 'Curl behavior updated successfully!' })
        setTimeout(() => setCurlMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating curl behavior:', err)
      setCurlMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setCurlSaving(false)
    }
  }

  const handleBlockMessageChange = async () => {
    setCurlSaving(true)
    setCurlMessage({ type: '', text: '' })

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
        setCurlMessage({ type: 'error', text: 'Failed to update block message. Please try again.' })
      } else {
        setCurlMessage({ type: 'success', text: 'Block message updated successfully!' })
        setTimeout(() => setCurlMessage({ type: '', text: '' }), 3000)
      }
    } catch (err) {
      console.error('Error updating block message:', err)
      setCurlMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setCurlSaving(false)
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
            disabled={fontSaving}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {fontSaving && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Saving...
            </p>
          )}

          {fontMessage.text && (
            <p className={`text-sm ${fontMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {fontMessage.text}
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
              disabled={bgSaving}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                backgroundColor === option.value
                  ? 'border-zinc-900 dark:border-white scale-110'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white hover:scale-105'
              } ${bgSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ backgroundColor: BACKGROUND_COLORS[option.value] }}
              title={option.label}
              aria-label={option.label}
            />
          ))}
        </div>

        {bgSaving && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">
            Saving...
          </p>
        )}

        {bgMessage.text && (
          <p className={`text-sm mt-3 ${bgMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {bgMessage.text}
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
                  } ${curlSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="curlBehavior"
                    value={option.value}
                    checked={curlBehavior === option.value}
                    onChange={(e) => handleCurlBehaviorChange(e.target.value)}
                    disabled={curlSaving}
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
                    disabled={curlSaving}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                    placeholder="Enter your custom block message..."
                  />
                  <button
                    onClick={handleBlockMessageChange}
                    disabled={curlSaving}
                    className="mt-3 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Block Message
                  </button>
                </div>
              )}
            </div>
          )}

          {curlSaving && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Saving...
            </p>
          )}

          {curlMessage.text && (
            <p className={`text-sm ${curlMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {curlMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsTab
