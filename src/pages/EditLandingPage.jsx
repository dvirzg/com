import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import NotionEditor from '../components/NotionEditor'

const EditLandingPage = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [landingPageId, setLandingPageId] = useState(null)

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/')
      return
    }
    loadLandingPage()
  }, [user, isAdmin])

  const loadLandingPage = async () => {
    setInitialLoading(true)
    const { data, error } = await supabase
      .from('landing_page')
      .select('*')
      .limit(1)
      .single()

    if (!error && data) {
      setLandingPageId(data.id)
      setTitle(data.title || '')
      setSubtitle(data.subtitle || '')
      setContent(data.content || '')
    }
    setInitialLoading(false)
  }

  const handleSave = async () => {
    if (!title.trim() || !subtitle.trim()) {
      alert('Please enter both title and subtitle')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('landing_page')
      .update({
        title,
        subtitle,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', landingPageId)

    if (error) {
      alert('Error saving landing page: ' + error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  if (!user || !isAdmin()) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Edit Landing Page
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:opacity-80 rounded-lg transition-opacity"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || initialLoading}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-24 px-6 pb-12">
        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-600 dark:text-zinc-300">Loading...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Hero Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Hi, I'm Dvir"
                className="w-full px-4 py-3 text-2xl font-bold bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Hero Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Welcome to my personal website."
                className="w-full px-4 py-3 text-lg bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Content (Markdown)
              </label>
              <NotionEditor
                initialContent={content}
                initialAlignment={[]}
                onChange={setContent}
                onAlignmentChange={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditLandingPage
