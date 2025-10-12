import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'

const Notes = () => {
  const { notes, loading, refetch, deleteNote } = useNotes()
  const { user, isAdmin } = useAuth()
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, noteId: null, noteTitle: '' })

  const handleRefresh = () => {
    refetch()
  }

  const handleDeleteClick = (noteId, noteTitle) => {
    setDeleteDialog({ isOpen: true, noteId, noteTitle })
  }

  const handleDeleteConfirm = async () => {
    if (deleteDialog.noteId) {
      const { error } = await deleteNote(deleteDialog.noteId)
      if (error) {
        alert('Failed to delete note: ' + error.message)
      }
    }
    setDeleteDialog({ isOpen: false, noteId: null, noteTitle: '' })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, noteId: null, noteTitle: '' })
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
            Notes
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Refresh notes"
            >
              ↻
            </button>
            {user && (
              <Link
                to="/editor"
                className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity"
              >
                New Note
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-zinc-600 dark:text-zinc-300">Loading...</p>
        ) : !notes || notes.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-300">No notes yet.</p>
        ) : (
          <div className="space-y-6">
            {notes.map((note) => (
              <div key={note.id} className="group relative">
                <Link
                  to={`/notes/${note.id}`}
                  className="block"
                >
                  <div className="py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                      {note.title}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
                      {new Date(note.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
                
                {isAdmin() && (
                  <div className="absolute top-4 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/editor?edit=${note.id}`}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit note"
                    >
                      <Edit size={16} className="text-zinc-600 dark:text-zinc-300" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteClick(note.id, note.title)
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
    </div>
  )
}

export default Notes
