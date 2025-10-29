import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Loading from '../components/Loading'

const ScrollArrow = () => {
  const { scrollYProgress } = useScroll()
  
  // Transform scroll progress to move arrow up smoothly and fade out
  const arrowY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const arrowScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
      className="absolute bottom-12"
      style={{ 
        y: arrowY, 
        opacity: arrowOpacity,
        scale: arrowScale
      }}
    >
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <ChevronDown className="text-zinc-400 dark:text-zinc-500" size={32} />
      </motion.div>
    </motion.div>
  )
}

const Home = () => {
  const { isAdmin } = useAuth()
  const { isDark } = useTheme()
  const [landingPage, setLandingPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLandingPage()
  }, [])

  const loadLandingPage = async () => {
    const { data, error } = await supabase
      .from('landing_page')
      .select('*')
      .limit(1)
      .single()

    if (!error && data) {
      setLandingPage(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="h-screen overflow-y-scroll transition-colors">
      {/* Hero Section */}
      <motion.div
        className="h-screen flex flex-col items-center justify-center px-6"
        style={{ position: 'relative' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-zinc-900 dark:text-white">
            {landingPage?.title || 'Hi, I\'m Dvir'}
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 mb-6">
            {landingPage?.subtitle || 'Welcome to my personal website.'}
          </p>
          <div className="flex justify-center">
            <div style={{
              mixBlendMode: isDark ? 'normal' : 'darken',
              display: 'inline-block'
            }}>
              <img
                src="/pulses.gif"
                alt="Wave interference animation"
                className="object-contain dark:invert"
                style={{
                  height: '40px',
                  imageRendering: 'crisp-edges'
                }}
              />
            </div>
          </div>
        </motion.div>

        <ScrollArrow />
      </motion.div>

      {/* Content Section */}
      <div className="h-screen flex flex-col items-center justify-start px-6 pt-30">
        <div className="text-left max-w-4xl w-full relative">
          {isAdmin() && (
            <Link
              to="/edit-landing"
              className="absolute -top-4 right-0 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Edit landing page"
            >
              <Edit size={20} className="text-zinc-600 dark:text-zinc-300" />
            </Link>
          )}

          <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h2: ({children}) => <h2 className="text-3xl md:text-4xl font-bold mb-6 text-zinc-900 dark:text-white">{children}</h2>,
                h3: ({children}) => <h3 className="text-2xl md:text-3xl font-bold mb-6 text-zinc-900 dark:text-white">{children}</h3>,
                p: ({children}) => <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8">{children}</p>,
                a: ({href, children}) => (
                  <a
                    href={href}
                    className="text-zinc-900 dark:text-white hover:opacity-80 transition-opacity"
                    style={{ textDecoration: 'underline', textDecorationSkipInk: 'none' }}
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                ),
                table: ({children}) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-700 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({children}) => <thead className="bg-zinc-50 dark:bg-zinc-800">{children}</thead>,
                tbody: ({children}) => <tbody>{children}</tbody>,
                tr: ({children}) => <tr className="border-b border-zinc-200 dark:border-zinc-700">{children}</tr>,
                th: ({children}) => (
                  <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-3 font-semibold text-left text-zinc-900 dark:text-white">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {children}
                  </td>
                ),
              }}
            >
              {landingPage?.content || '## About Me\n\n...\n\n## Let\'s Connect\n\nEmail me at [dvirzagury@gmail.com](mailto:dvirzagury@gmail.com).'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
