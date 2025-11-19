import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Edit, Trash2, X, Filter } from 'lucide-react'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { BACKGROUND_COLORS } from '../constants/colors'
import { supabase } from '../lib/supabase'
import ConfirmDialog from '../components/ConfirmDialog'
import Loading from '../components/Loading'
import ScrollToTop from '../components/ScrollToTop'
import ReactMarkdown from 'react-markdown'

const Notes = () => {
  const { notes, loading, refetch, deleteNote } = useNotes()
  const { isAdmin } = useAuth()
  const { isDark, backgroundColor } = useTheme()
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, noteId: null, noteTitle: '' })
  const [allCategories, setAllCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [orderBy, setOrderBy] = useState('published') // 'published' or 'updated'
  const [orderDirection, setOrderDirection] = useState('desc') // 'asc' or 'desc'
  const [showFilters, setShowFilters] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showOrderDropdown, setShowOrderDropdown] = useState(false)
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    loadCategories()
    // Fetch notes when the Notes page is accessed
    refetch()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false)
      }
      if (showOrderDropdown && !event.target.closest('.order-dropdown')) {
        setShowOrderDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoryDropdown, showOrderDropdown])

  useEffect(() => {
    const handleScroll = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect()
        setShowStickyTitle(titleRect.top < 80)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (data) {
      setAllCategories(data)
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const filteredAndSortedNotes = () => {
    if (!notes) return []

    let filtered = notes

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(note =>
        note.categories && note.categories.some(cat => selectedCategories.includes(cat.id))
      )
    }

    // Sort by date
    const sorted = [...filtered].sort((a, b) => {
      let dateA, dateB

      if (orderBy === 'published') {
        dateA = new Date(a.published_at || a.created_at)
        dateB = new Date(b.published_at || b.created_at)
      } else { // updated
        dateA = new Date(a.updated_at || a.created_at)
        dateB = new Date(b.updated_at || b.created_at)
      }

      // Apply order direction
      if (orderDirection === 'asc') {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    })

    return sorted
  }

  const handleDeleteClick = (noteId, noteTitle) => {
    setDeleteDialog({ isOpen: true, noteId, noteTitle })
  }

  const handleDeleteConfirm = async () => {
    if (deleteDialog.noteId) {
      const { error } = await deleteNote(deleteDialog.noteId)
      if (error) {
        alert('Failed to delete note: ' + error.message)
      } else {
        // Force a refetch to ensure UI updates
        refetch()
      }
      // Close dialog after processing
      setDeleteDialog({ isOpen: false, noteId: null, noteTitle: '' })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, noteId: null, noteTitle: '' })
  }

  const stickyBgColor = isDark
    ? 'rgba(0, 0, 0, 0.8)'
    : `${BACKGROUND_COLORS[backgroundColor] || BACKGROUND_COLORS.white}B3`

  return (
    <>
      {/* Sticky Title Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl transition-all duration-300 ${
          showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
        }`}
        style={{ backgroundColor: stickyBgColor }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
              Notes
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-24 pb-12 px-6 transition-colors">
        <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
            Notes
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Filter & Sort"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={handleRefresh}
              className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Refresh notes"
            >
              ↻
            </button>
            {isAdmin() && (
              <Link
                to="/editor"
                className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity"
              >
                New Note
              </Link>
            )}
          </div>
        </div>

        {/* Filters and Sorting */}
        {showFilters && (
          <div className="mb-8 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex flex-wrap items-center gap-6">
              {/* Order By */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Order by:
                </label>
                <div className="relative order-dropdown">
                  <button
                    onClick={() => setShowOrderDropdown(!showOrderDropdown)}
                    className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 min-w-[200px] flex items-center justify-between"
                  >
                    <span>
                      {orderBy === 'published' && orderDirection === 'desc' && 'Published (newest first)'}
                      {orderBy === 'published' && orderDirection === 'asc' && 'Published (oldest first)'}
                      {orderBy === 'updated' && orderDirection === 'desc' && 'Updated (newest first)'}
                      {orderBy === 'updated' && orderDirection === 'asc' && 'Updated (oldest first)'}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showOrderDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
                      <button
                        onClick={() => {
                          setOrderBy('published')
                          setOrderDirection('desc')
                          setShowOrderDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                          orderBy === 'published' && orderDirection === 'desc'
                            ? 'bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        Published (newest first)
                      </button>
                      <button
                        onClick={() => {
                          setOrderBy('published')
                          setOrderDirection('asc')
                          setShowOrderDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                          orderBy === 'published' && orderDirection === 'asc'
                            ? 'bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        Published (oldest first)
                      </button>
                      <button
                        onClick={() => {
                          setOrderBy('updated')
                          setOrderDirection('desc')
                          setShowOrderDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                          orderBy === 'updated' && orderDirection === 'desc'
                            ? 'bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        Updated (newest first)
                      </button>
                      <button
                        onClick={() => {
                          setOrderBy('updated')
                          setOrderDirection('asc')
                          setShowOrderDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                          orderBy === 'updated' && orderDirection === 'asc'
                            ? 'bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        Updated (oldest first)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories Filter */}
              {allCategories.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Categories:
                  </label>
                  <div className="relative category-dropdown">
                    <button
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 min-w-[180px] flex items-center justify-between"
                    >
                      <span>
                        {selectedCategories.length === 0
                          ? 'Select...'
                          : `${selectedCategories.length} selected`}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showCategoryDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {allCategories.map(cat => (
                          <label
                            key={cat.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat.id)}
                              onChange={() => toggleCategory(cat.id)}
                              className="rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-400"
                            />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {cat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full hover:opacity-80 shadow-sm"
                        title="Clear category filters"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <Loading fullScreen={false} />
        ) : !notes || notes.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-300">No notes yet.</p>
        ) : filteredAndSortedNotes().length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-300">No notes match the selected filters.</p>
        ) : (
          <div className="space-y-0">
            {filteredAndSortedNotes().map((note) => (
              <div key={note.id} className="group relative">
                <Link
                  to={`/notes/${note.id}`}
                  className="block"
                >
                  <div className="py-5 border-b border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                    <div className="flex items-center justify-between gap-6">
                      <h2 className="text-2xl font-normal text-zinc-900 dark:text-white group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors [&_em]:italic [&_strong]:font-semibold [&_del]:line-through">
                        <ReactMarkdown components={{ p: 'span' }}>{note.title}</ReactMarkdown>
                      </h2>
                      <div className="flex flex-col gap-1 items-end">
                        <p className="text-xs tracking-wider uppercase text-zinc-400 dark:text-zinc-600 whitespace-nowrap">
                          {new Date(note.published_at || note.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        {note.categories && note.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {note.categories.map(cat => (
                              <span
                                key={cat.id}
                                className="text-xs tracking-wider uppercase text-zinc-400 dark:text-zinc-600"
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {isAdmin() && (
                  <div className="absolute top-5 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/editor?edit=${note.id}`}
                      className="p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      title="Edit note"
                    >
                      <Edit size={14} className="text-zinc-400 dark:text-zinc-600" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteClick(note.id, note.title)
                      }}
                      className="p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 size={14} className="text-zinc-400 dark:text-zinc-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteDialog.noteTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ScrollToTop />
    </>
  )
}

export default Notes
