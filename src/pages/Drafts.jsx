import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Edit, Trash2, X, Filter } from 'lucide-react'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ConfirmDialog from '../components/ConfirmDialog'
import ScrollToTop from '../components/ScrollToTop'

const Drafts = () => {
  const { drafts, draftsLoading, fetchDrafts, deleteNote } = useNotes()
  const { isAdmin } = useAuth()
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, noteId: null, noteTitle: '' })
  const [allCategories, setAllCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    fetchDrafts()
    loadCategories()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoryDropdown])

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
    fetchDrafts()
  }

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const filteredDrafts = () => {
    if (!drafts) return []

    let filtered = drafts

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(draft =>
        draft.categories && draft.categories.some(cat => selectedCategories.includes(cat.id))
      )
    }

    return filtered
  }

  const handleDeleteClick = (noteId, noteTitle) => {
    setDeleteDialog({ isOpen: true, noteId, noteTitle })
  }

  const handleDeleteConfirm = async () => {
    if (deleteDialog.noteId) {
      const { error } = await deleteNote(deleteDialog.noteId)
      if (error) {
        alert('Failed to delete draft: ' + error.message)
      } else {
        // Force a refetch to ensure UI updates
        fetchDrafts()
      }
      // Close dialog after processing
      setDeleteDialog({ isOpen: false, noteId: null, noteTitle: '' })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, noteId: null, noteTitle: '' })
  }

  // Only admins can view drafts
  if (!isAdmin()) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black transition-colors">
        <div className="max-w-3xl mx-auto">
          <p className="text-zinc-600 dark:text-zinc-300">Access denied.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Sticky Title Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-black/80 transition-all duration-300 ${
        showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
              Drafts
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black transition-colors">
        <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
            Drafts
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
              title="Refresh drafts"
            >
              ↻
            </button>
            <Link
              to="/editor"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity"
            >
              New Note
            </Link>
          </div>
        </div>

        {/* Filters */}
        {showFilters && allCategories.length > 0 && (
          <div className="mb-8 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex flex-wrap items-center gap-6">
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

        {draftsLoading ? (
          <p className="text-zinc-600 dark:text-zinc-300">Loading...</p>
        ) : !drafts || drafts.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-300">No drafts yet.</p>
        ) : filteredDrafts().length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-300">No drafts match the selected filters.</p>
        ) : (
          <div className="space-y-0">
            {filteredDrafts().map((draft) => (
              <div key={draft.id} className="group relative">
                <Link
                  to={`/notes/${draft.id}`}
                  className="block"
                >
                  <div className="py-5 border-b border-zinc-100 dark:border-zinc-900 transition-all hover:border-zinc-200 dark:hover:border-zinc-800">
                    <div className="flex items-baseline gap-6">
                      <h2 className="text-2xl font-normal text-zinc-900 dark:text-white group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors">
                        {draft.title}
                      </h2>
                      <p className="text-xs tracking-wider uppercase text-zinc-300 dark:text-zinc-700 whitespace-nowrap">
                        {new Date(draft.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      {draft.categories && draft.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {draft.categories.map(cat => (
                            <span
                              key={cat.id}
                              className="text-xs tracking-wider uppercase text-zinc-300 dark:text-zinc-700"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="absolute top-5 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/editor?edit=${draft.id}`}
                    className="p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    title="Edit draft"
                  >
                    <Edit size={14} className="text-zinc-400 dark:text-zinc-600" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteClick(draft.id, draft.title)
                    }}
                    className="p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 size={14} className="text-zinc-400 dark:text-zinc-600" />
                  </button>
                </div>
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
        title="Delete Draft"
        message={`Are you sure you want to delete "${deleteDialog.noteTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ScrollToTop />
    </>
  )
}

export default Drafts
