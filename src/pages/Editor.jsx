import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotes } from '../contexts/NotesContext'
import NotionEditor from '../components/NotionEditor'

const Editor = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refetch } = useNotes()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    navigate('/login')
    return null
  }

  const extractTitle = (markdown) => {
    const lines = markdown.trim().split('\n')
    if (lines.length === 0) return 'Untitled'
    const firstLine = lines[0].trim()
    if (firstLine.startsWith('##')) {
      return firstLine.replace(/^##\s*/, '')
    }
    return firstLine.replace(/^#\s*/, '')
  }

  const handlePublish = async () => {
    if (!content.trim()) {
      alert('Please write some content')
      return
    }

    setLoading(true)
    const title = extractTitle(content)

    const { error } = await supabase.from('notes').insert([
      {
        title,
        content,
        published: true,
      },
    ])

    if (error) {
      alert('Error publishing note: ' + error.message)
    } else {
      refetch()
      navigate('/notes')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            New Note
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/notes')}
              className="px-4 py-2 text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:opacity-80 rounded-lg transition-opacity"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-24 px-6 pb-12">
        <NotionEditor initialContent={content} onChange={setContent} />
      </div>
    </div>
  )
}

export default Editor
