import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import NotionEditor from '../components/NotionEditor'

const PageEditor = () => {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user, isAdmin } = useAuth()
  const [title, setTitle] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [content, setContent] = useState('')
  const [showInNav, setShowInNav] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(!!slug)
  const [pageId, setPageId] = useState(null)
  const [isEditMode, setIsEditMode] = useState(!!slug)

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/')
      return
    }
    if (slug) {
      loadPage()
    }
  }, [user, isAdmin, slug])

  const loadPage = async () => {
    setInitialLoading(true)
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!error && data) {
      setPageId(data.id)
      setTitle(data.title || '')
      setPageSlug(data.slug || '')
      setContent(data.content || '')
      setShowInNav(data.show_in_nav ?? true)
    }
    setInitialLoading(false)
  }

  const handleSave = async () => {
    if (!title.trim() || !pageSlug.trim()) {
      alert('Please enter both title and slug')
      return
    }

    setLoading(true)

    const slugFormatted = pageSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    if (isEditMode && pageId) {
      // Update existing page
      const { error } = await supabase
        .from('pages')
        .update({
          title,
          slug: slugFormatted,
          content,
          show_in_nav: showInNav,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId)

      if (error) {
        alert('Error updating page: ' + error.message)
      } else {
        navigate('/admin')
      }
    } else {
      // Create new page
      const { error } = await supabase
        .from('pages')
        .insert([{
          title,
          slug: slugFormatted,
          content,
          show_in_nav: showInNav,
        }])

      if (error) {
        alert('Error creating page: ' + error.message)
      } else {
        navigate('/admin')
      }
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
            {isEditMode ? 'Edit Page' : 'New Page'}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin')}
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
                Page Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="About"
                className="w-full px-4 py-3 text-2xl font-bold bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                placeholder="about"
                disabled={isEditMode}
                className="w-full px-4 py-3 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors disabled:opacity-50"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Will be accessible at: {window.location.origin}/{pageSlug.toLowerCase().replace(/\s+/g, '-')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showInNav"
                checked={showInNav}
                onChange={(e) => setShowInNav(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
              />
              <label htmlFor="showInNav" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Show in navigation
              </label>
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

export default PageEditor
