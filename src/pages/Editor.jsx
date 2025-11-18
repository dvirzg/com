import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import 'katex/dist/katex.min.css'
import { useAuth } from '../contexts/AuthContext'
import { useNotes } from '../contexts/NotesContext'
import NotionEditor from '../components/NotionEditor'
import { useCategoryManager } from '../hooks/useCategoryManager'
import { useNoteEditor } from '../hooks/useNoteEditor'

const Editor = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAdmin } = useAuth()
  const { refetch, getNoteForEdit } = useNotes()
  const { loading, saveDraft, publishNote } = useNoteEditor()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [alignment, setAlignment] = useState([])
  const [_isEditing, setIsEditing] = useState(false)
  const [noteId, setNoteId] = useState(null)
  const [initialLoading, setInitialLoading] = useState(false)
  const [publishedAt, setPublishedAt] = useState('')

  const categoryManager = useCategoryManager(noteId)

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
      setTitle(note.title || '')
      setContent(note.content)
      if (note.alignment) {
        try {
          const parsedAlignment = typeof note.alignment === 'string' ? JSON.parse(note.alignment) : note.alignment
          setAlignment(parsedAlignment)
        } catch (_e) {
          setAlignment([])
        }
      } else {
        setAlignment([])
      }
      if (note.published_at) {
        const date = new Date(note.published_at)
        const formatted = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setPublishedAt(formatted)
      }
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

  const handleSaveDraft = async () => {
    const noteData = {
      title,
      content,
      alignment: JSON.stringify(alignment)
    }

    const result = await saveDraft(noteData, noteId, async (savedNote) => {
      await categoryManager.saveCategories(savedNote.id)
      refetch()
      navigate('/drafts')
    })

    if (!result.error) {
      // Success handled in callback
    }
  }

  const handlePublish = async () => {
    const noteData = {
      title,
      content,
      alignment: JSON.stringify(alignment),
      published_at: publishedAt
    }

    const result = await publishNote(noteData, noteId, async (savedNote) => {
      await categoryManager.saveCategories(savedNote.id)
      refetch()
      navigate('/notes')
    })

    if (!result.error) {
      // Success handled in callback
    }
  }

  return (
    <div className="min-h-screen transition-colors">
      <div className="pt-24 pb-12 px-6">
        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-600 dark:text-zinc-300">Loading note...</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="flex-1 px-0 py-3 text-4xl font-bold bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none border-b-2 border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 transition-colors"
              />
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <button
                  onClick={() => navigate('/notes')}
                  className="px-3 py-2 text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:opacity-80 rounded-lg transition-opacity"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={loading || initialLoading}
                  className="px-3 py-2 text-sm font-medium bg-zinc-400 dark:bg-zinc-600 text-white hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Draft'}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={loading || initialLoading}
                  className="px-3 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Publish Date:
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                />
                {publishedAt && (
                  <button
                    onClick={() => setPublishedAt('')}
                    className="text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    Today
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 block mb-2">
                  Categories:
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categoryManager.selectedCategories.map(cat => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full"
                    >
                      {cat.name}
                      <button
                        onClick={() => categoryManager.handleRemoveCategory(cat.id)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {!categoryManager.showCategoryInput && (
                  <div className="flex flex-wrap gap-2">
                    {categoryManager.allCategories.filter(cat => !categoryManager.selectedCategories.find(sc => sc.id === cat.id)).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => categoryManager.handleToggleCategory(cat)}
                        className="px-3 py-1 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        + {cat.name}
                      </button>
                    ))}
                    <button
                      onClick={() => categoryManager.setShowCategoryInput(true)}
                      className="px-3 py-1 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                      + New category
                    </button>
                  </div>
                )}

                {categoryManager.showCategoryInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={categoryManager.newCategoryInput}
                      onChange={(e) => categoryManager.setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && categoryManager.handleAddCategory()}
                      placeholder="Category name..."
                      className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                      autoFocus
                    />
                    <button
                      onClick={categoryManager.handleAddCategory}
                      className="px-3 py-1.5 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-80"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        categoryManager.setShowCategoryInput(false)
                        categoryManager.setNewCategoryInput('')
                      }}
                      className="px-3 py-1.5 text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:opacity-80"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            <NotionEditor
              initialContent={content}
              initialAlignment={alignment}
              onChange={setContent}
              onAlignmentChange={setAlignment}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Editor
