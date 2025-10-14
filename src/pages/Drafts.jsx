import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'

const Drafts = () => {
  const { drafts, draftsLoading, fetchDrafts, deleteNote } = useNotes()
  const { isAdmin } = useAuth()
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, noteId: null, noteTitle: '' })

  useEffect(() => {
    fetchDrafts()
  }, [])

  const handleRefresh = () => {
    fetchDrafts()
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
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
            Drafts
          </h1>
          <div className="flex gap-2">
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

        {draftsLoading ? (
          <p className="text-zinc-600 dark:text-zinc-300">Loading...</p>
        ) : !drafts || drafts.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-300">No drafts yet.</p>
        ) : (
          <div className="space-y-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="group relative">
                <div className="py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                        {draft.title}
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                        Created: {new Date(draft.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/notes/${draft.id}?preview=true`}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Preview draft"
                      >
                        <Eye size={16} className="text-zinc-600 dark:text-zinc-300" />
                      </Link>
                      <Link
                        to={`/editor?edit=${draft.id}`}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit draft"
                      >
                        <Edit size={16} className="text-zinc-600 dark:text-zinc-300" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteClick(draft.id, draft.title)
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  )
}

export default Drafts
