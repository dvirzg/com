import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotes } from '../contexts/NotesContext'
import NotionEditor from '../components/NotionEditor'

const Editor = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAdmin } = useAuth()
  const { refetch, getNoteForEdit } = useNotes()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [noteId, setNoteId] = useState(null)
  const [initialLoading, setInitialLoading] = useState(false)

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setIsEditing(true)
      setNoteId(editId)
      loadNote(editId)
    }
  }, [searchParams])

  const loadNote = async (id) => {
    setInitialLoading(true)
    const note = await getNoteForEdit(id)
    if (note) {
      setContent(note.content)
    } else {
      navigate('/notes')
    }
    setInitialLoading(false)
  }

  if (!user) {
    navigate('/login')
    return null
  }

  if (!isAdmin()) {
    navigate('/notes')
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

    if (isEditing && noteId) {
      // Update existing note
      const { error } = await supabase
        .from('notes')
        .update({
          title,
          content,
        })
        .eq('id', noteId)

      if (error) {
        alert('Error updating note: ' + error.message)
      } else {
        refetch()
        navigate('/notes')
      }
    } else {
      // Create new note
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
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {isEditing ? 'Edit Note' : 'New Note'}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/notes')}
              className="px-4 py-2 text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:opacity-80 rounded-lg transition-opacity"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={loading || initialLoading}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
            >
              {loading ? (isEditing ? 'Updating...' : 'Publishing...') : (isEditing ? 'Update' : 'Publish')}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-24 px-6 pb-12">
        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-600 dark:text-zinc-300">Loading note...</p>
          </div>
        ) : (
          <NotionEditor initialContent={content} onChange={setContent} />
        )}
      </div>
    </div>
  )
}

export default Editor
