import { Link } from 'react-router-dom'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'

const Notes = () => {
  const { notes, loading, refetch } = useNotes()
  const { user } = useAuth()

  const handleRefresh = () => {
    refetch()
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100">
            Notes
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        ) : !notes || notes.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No notes yet.</p>
        ) : (
          <div className="space-y-6">
            {notes.map((note) => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="block group"
              >
                <div className="py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notes
