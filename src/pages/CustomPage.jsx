import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Loading from '../components/Loading'
import ScrollToTop from '../components/ScrollToTop'

const CustomPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    loadPage()
  }, [slug])

  useEffect(() => {
    const handleScroll = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect()
        setShowStickyTitle(titleRect.top < 80)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [page])

  const loadPage = async () => {
    // First check if it's a sublink (redirect)
    const { data: sublinkData } = await supabase
      .from('sublinks')
      .select('*')
      .eq('slug', slug)
      .single()

    if (sublinkData) {
      // It's a sublink, redirect immediately
      window.location.href = sublinkData.url
      return
    }

    // Otherwise, try to load it as a custom page
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      navigate('/')
    } else {
      setPage(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <>
      {/* Sticky Title Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-black/80 transition-all duration-300 ${
        showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white break-words">
              {page?.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-black transition-colors">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white break-words">
              {page?.title}
            </h1>
          {isAdmin() && (
            <Link
              to={`/admin/pages/edit/${page?.slug}`}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Edit page"
            >
              <Edit size={20} className="text-zinc-600 dark:text-zinc-300" />
            </Link>
          )}
          </div>

          <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none break-words overflow-wrap-anywhere">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
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
              ul({ children }) {
                return <ul className="list-disc ml-6 my-4">{children}</ul>
              },
              ol({ children }) {
                return <ol className="list-decimal ml-6 my-4 marker:text-zinc-900 dark:marker:text-white">{children}</ol>
              },
              li({ children }) {
                return <li className="my-1">{children}</li>
              },
              p({ children }) {
                return <p className="text-lg text-zinc-600 dark:text-zinc-200 leading-relaxed my-4">{children}</p>
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
            {page?.content || ''}
          </ReactMarkdown>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </>
  )
}

export default CustomPage
