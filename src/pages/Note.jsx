import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'
import { useNotes } from '../contexts/NotesContext'

const Note = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getNote } = useNotes()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-zinc-950 transition-colors">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          {note?.title}
        </h1>
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
                  <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-3 font-semibold text-left text-zinc-900 dark:text-zinc-100">
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
    </div>
  )
}

export default Note
