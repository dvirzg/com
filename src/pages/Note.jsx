import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'

const Note = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getNote, deleteNote } = useNotes()
  const { isAdmin } = useAuth()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false })

  useEffect(() => {
    loadNote()
  }, [id])

  const loadNote = async () => {
    const data = await getNote(id)
    if (!data) {
      navigate('/notes')
    } else {
      setNote(data)
    }
    setLoading(false)
  }

  const handleDeleteClick = () => {
    setDeleteDialog({ isOpen: true })
  }

  const handleDeleteConfirm = async () => {
    if (note?.id) {
      const { error } = await deleteNote(note.id)
      if (error) {
        alert('Failed to delete note: ' + error.message)
      } else {
        navigate('/notes')
      }
    }
    setDeleteDialog({ isOpen: false })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false })
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-300">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black transition-colors">
      <article className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
            {note?.title}
          </h1>
          {isAdmin() && (
            <div className="flex gap-2 ml-4">
              <Link
                to={`/editor?edit=${note?.id}`}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Edit note"
              >
                <Edit size={20} className="text-zinc-600 dark:text-zinc-300" />
              </Link>
              <button
                onClick={handleDeleteClick}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                title="Delete note"
              >
                <Trash2 size={20} className="text-red-500" />
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8">
          {new Date(note?.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : ''
                
                if (!inline && language) {
                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      className="rounded-lg"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  )
                }
                
                return (
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                )
              },
              img({ src, alt, title }) {
                return (
                  <img 
                    src={src} 
                    alt={alt} 
                    title={title} 
                    className="max-w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow" 
                    onError={(e) => {
                      console.log('Image failed to load:', src);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', src);
                    }}
                  />
                )
              },
              a({ href, children }) {
                return (
                  <a 
                    href={href} 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                )
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic my-4 text-zinc-700 dark:text-zinc-300">
                    {children}
                  </blockquote>
                )
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-700 rounded-lg">
                      {children}
                    </table>
                  </div>
                )
              },
              thead({ children }) {
                return <thead className="bg-zinc-50 dark:bg-zinc-800">{children}</thead>
              },
              tbody({ children }) {
                return <tbody>{children}</tbody>
              },
              tr({ children }) {
                return <tr className="border-b border-zinc-200 dark:border-zinc-700">{children}</tr>
              },
              th({ children }) {
                return (
                  <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-3 font-semibold text-left text-zinc-900 dark:text-white">
                    {children}
                  </th>
                )
              },
              td({ children }) {
                return (
                  <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {children}
                  </td>
                )
              }
            }}
          >
            {note?.content}
          </ReactMarkdown>
        </div>
      </article>
      
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        message={`Are you sure you want to delete "${note?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

export default Note
