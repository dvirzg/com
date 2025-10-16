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
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [alignment, setAlignment] = useState([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [noteId, setNoteId] = useState(null)
  const [initialLoading, setInitialLoading] = useState(false)
  const [publishedAt, setPublishedAt] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)

  useEffect(() => {
    loadCategories()
    const editId = searchParams.get('edit')
    if (editId) {
      setIsEditing(true)
      setNoteId(editId)
      loadNote(editId)
    }
  }, [searchParams])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (data) {
      setAllCategories(data)
    }
  }

  const loadNote = async (id) => {
    setInitialLoading(true)
    const note = await getNoteForEdit(id)
    if (note) {
      setTitle(note.title || '')
      setContent(note.content)
      // Parse alignment data if it exists
      if (note.alignment) {
        try {
          const parsedAlignment = typeof note.alignment === 'string' ? JSON.parse(note.alignment) : note.alignment
          setAlignment(parsedAlignment)
        } catch (e) {
          setAlignment([])
        }
      } else {
        setAlignment([])
      }
      // Set published_at if it exists, format for datetime-local input
      if (note.published_at) {
        const date = new Date(note.published_at)
        const formatted = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setPublishedAt(formatted)
      }
      // Load categories for this note
      const { data: noteCategories } = await supabase
        .from('note_categories')
        .select('category_id, categories(id, name)')
        .eq('note_id', id)
      if (noteCategories) {
        setSelectedCategories(noteCategories.map(nc => nc.categories))
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

  const handleAddCategory = async () => {
    const categoryName = newCategoryInput.trim()
    if (!categoryName) return

    // Check if category already exists
    const existing = allCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
    if (existing) {
      // Add to selected if not already there
      if (!selectedCategories.find(c => c.id === existing.id)) {
        setSelectedCategories([...selectedCategories, existing])
      }
      setNewCategoryInput('')
      setShowCategoryInput(false)
      return
    }

    // Create new category
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: categoryName }])
      .select()
      .single()

    if (error) {
      alert('Error creating category: ' + error.message)
    } else {
      setAllCategories([...allCategories, data])
      setSelectedCategories([...selectedCategories, data])
      setNewCategoryInput('')
      setShowCategoryInput(false)
    }
  }

  const handleRemoveCategory = (categoryId) => {
    setSelectedCategories(selectedCategories.filter(c => c.id !== categoryId))
  }

  const handleToggleCategory = (category) => {
    const isSelected = selectedCategories.find(c => c.id === category.id)
    if (isSelected) {
      setSelectedCategories(selectedCategories.filter(c => c.id !== category.id))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const saveCategoriesForNote = async (noteId) => {
    // Delete existing category associations
    await supabase
      .from('note_categories')
      .delete()
      .eq('note_id', noteId)

    // Insert new category associations
    if (selectedCategories.length > 0) {
      const insertData = selectedCategories.map(cat => ({
        note_id: noteId,
        category_id: cat.id
      }))
      await supabase
        .from('note_categories')
        .insert(insertData)
    }
  }

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!content.trim()) {
      alert('Please write some content')
      return
    }

    setLoading(true)

    if (isEditing && noteId) {
      // Update existing note as draft
      const { error } = await supabase
        .from('notes')
        .update({
          title,
          content,
          alignment: JSON.stringify(alignment),
          published: false,
        })
        .eq('id', noteId)

      if (error) {
        alert('Error saving draft: ' + error.message)
      } else {
        await saveCategoriesForNote(noteId)
        refetch()
        navigate('/drafts')
      }
    } else {
      // Create new draft
      const { data, error } = await supabase.from('notes').insert([
        {
          title,
          content,
          alignment: JSON.stringify(alignment),
          published: false,
        },
      ]).select()

      if (error) {
        alert('Error saving draft: ' + error.message)
      } else {
        await saveCategoriesForNote(data[0].id)
        refetch()
        navigate('/drafts')
      }
    }
    setLoading(false)
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!content.trim()) {
      alert('Please write some content')
      return
    }

    setLoading(true)

    // Prepare the published_at timestamp
    const publishedAtTimestamp = publishedAt
      ? new Date(publishedAt).toISOString()
      : new Date().toISOString()

    if (isEditing && noteId) {
      // Update existing note and publish
      const { error } = await supabase
        .from('notes')
        .update({
          title,
          content,
          alignment: JSON.stringify(alignment),
          published: true,
          published_at: publishedAtTimestamp,
        })
        .eq('id', noteId)

      if (error) {
        alert('Error publishing note: ' + error.message)
      } else {
        await saveCategoriesForNote(noteId)
        refetch()
        navigate('/notes')
      }
    } else {
      // Create new note and publish
      const { data, error } = await supabase.from('notes').insert([
        {
          title,
          content,
          alignment: JSON.stringify(alignment),
          published: true,
          published_at: publishedAtTimestamp,
        },
      ]).select()

      if (error) {
        alert('Error publishing note: ' + error.message)
      } else {
        await saveCategoriesForNote(data[0].id)
        refetch()
        navigate('/notes')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="pt-24 px-6 pb-12">
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
                  {selectedCategories.map(cat => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full"
                    >
                      {cat.name}
                      <button
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {!showCategoryInput && (
                  <div className="flex flex-wrap gap-2">
                    {allCategories.filter(cat => !selectedCategories.find(sc => sc.id === cat.id)).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleToggleCategory(cat)}
                        className="px-3 py-1 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        + {cat.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowCategoryInput(true)}
                      className="px-3 py-1 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                      + New category
                    </button>
                  </div>
                )}

                {showCategoryInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      placeholder="Category name..."
                      className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                      autoFocus
                    />
                    <button
                      onClick={handleAddCategory}
                      className="px-3 py-1.5 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-80"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowCategoryInput(false)
                        setNewCategoryInput('')
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
