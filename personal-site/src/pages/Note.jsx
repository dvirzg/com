import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
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
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {note?.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  )
}

export default Note
