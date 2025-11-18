import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'
import { BACKGROUND_COLORS } from '../constants/colors'
import { supabase } from '../lib/supabase'
import { isTwitterUrl } from '../lib/utils'
import ConfirmDialog from '../components/ConfirmDialog'
import Loading from '../components/Loading'
import ScrollToTop from '../components/ScrollToTop'
import TableOfContents from '../components/TableOfContents'
import TwitterEmbed from '../components/TwitterEmbed'

const Note = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getNote, getNoteForEdit, deleteNote } = useNotes()
  const { isAdmin } = useAuth()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false })
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    loadNote()
  }, [id])

  const loadNote = async () => {
    // For admins, use getNoteForEdit to get drafts too
    const data = isAdmin() ? await getNoteForEdit(id) : await getNote(id)
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

  const handlePublish = async () => {
    if (!note?.id) return

    setPublishing(true)
    const { error } = await supabase
      .from('notes')
      .update({
        published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', note.id)

    if (error) {
      alert('Failed to publish note: ' + error.message)
    } else {
      navigate('/notes')
    }
    setPublishing(false)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <>

      <div className="min-h-screen transition-colors relative">
        {/* Table of Contents Sidebar - Fixed to left side */}
        <aside className="hidden xl:block fixed left-8 top-24 w-64">
          <TableOfContents content={note?.content} />
        </aside>

        {/* Main content - Standard container width */}
        <div className="pt-24 pb-12 px-6">
          <article className="max-w-3xl mx-auto overflow-x-hidden">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white break-words [&_em]:italic [&_strong]:font-bold [&_del]:line-through">
              <ReactMarkdown components={{ p: 'span' }}>{note?.title}</ReactMarkdown>
            </h1>
            {!note?.published && isAdmin() && (
              <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
                Draft
              </span>
            )}
          </div>
          {isAdmin() && (
            <div className="flex gap-2 ml-4">
              {!note?.published && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
                  title="Publish note"
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              )}
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
        <div className="mb-8">
          <div className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1 mb-3">
            {note?.published_at && (
              <p>
                <span className="font-medium">Published:</span>{' '}
                {new Date(note.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {note?.updated_at && note?.published_at &&
             new Date(note.updated_at).getTime() - new Date(note.published_at).getTime() > 60000 && (
              <p>
                <span className="font-medium">Last updated:</span>{' '}
                {new Date(note.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {!note?.published_at && (
              <p>
                {new Date(note?.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
          {note?.categories && note.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.categories.map(cat => (
                <span
                  key={cat.id}
                  className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none break-words overflow-wrap-anywhere">
          {(() => {
            const blocks = note?.content ? note.content.split('\n\n') : []
            let alignments = []

            // Parse alignment data
            if (note?.alignment) {
              try {
                alignments = typeof note.alignment === 'string' ? JSON.parse(note.alignment) : note.alignment
              } catch (_e) {
                alignments = []
              }
            }

            return blocks.map((block, index) => {
              const alignment = alignments[index] || 'left'

              // Generate heading ID function to match TableOfContents
              const generateHeadingId = (text, blockIndex) => {
                const cleanText = typeof text === 'string' ? text : String(text)
                return `heading-${blockIndex}-${cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
              }

              return (
                <div key={index} className="mb-6 break-words" style={{ textAlign: alignment }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
              h1: ({children}) => {
                const text = typeof children === 'string' ? children : (children?.[0] || '')
                const id = generateHeadingId(text, index)
                return <h1 id={id} className="text-3xl font-bold my-4 scroll-mt-24">{children}</h1>
              },
              h2: ({children}) => {
                const text = typeof children === 'string' ? children : (children?.[0] || '')
                const id = generateHeadingId(text, index)
                return <h2 id={id} className="text-2xl font-bold my-3 scroll-mt-24">{children}</h2>
              },
              h3: ({children}) => {
                const text = typeof children === 'string' ? children : (children?.[0] || '')
                const id = generateHeadingId(text, index)
                return <h3 id={id} className="text-xl font-bold my-3 scroll-mt-24">{children}</h3>
              },
              h4: ({children}) => {
                const text = typeof children === 'string' ? children : (children?.[0] || '')
                const id = generateHeadingId(text, index)
                return <h4 id={id} className="text-lg font-bold my-2 scroll-mt-24">{children}</h4>
              },
              h5: ({children}) => {
                const text = typeof children === 'string' ? children : (children?.[0] || '')
                const id = generateHeadingId(text, index)
                return <h5 id={id} className="text-base font-bold my-2 scroll-mt-24">{children}</h5>
              },
              h6: ({children}) => {
                const text = typeof children === 'string' ? children : (children?.[0] || '')
                const id = generateHeadingId(text, index)
                return <h6 id={id} className="text-sm font-bold my-2 scroll-mt-24">{children}</h6>
              },
              p: ({children}) => <p className="mb-6" style={{ fontSize: '18px', lineHeight: '27px' }}>{children}</p>,
              code({ inline, className, children, ...props }) {
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
                      e.target.style.display = 'none';
                    }}
                  />
                )
              },
              a({ href, children }) {
                if (isTwitterUrl(href)) {
                  return <TwitterEmbed url={href} />
                }
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
              },
              ul({ children }) {
                return <ul className="list-disc ml-6 my-4">{children}</ul>
              },
              ol({ children }) {
                return <ol className="list-decimal ml-6 my-4 marker:text-zinc-900 dark:marker:text-white">{children}</ol>
              },
              li({ children }) {
                return <li className="my-1">{children}</li>
              }
                    }}
                  >
                    {block}
                  </ReactMarkdown>
                </div>
              )
            })
          })()}
        </div>
          </article>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        message={`Are you sure you want to delete "${note?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ScrollToTop />
    </>
  )
}

export default Note
