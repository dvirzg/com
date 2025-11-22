import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Folder, FileText, BookOpen, ChevronLeft } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import NotebookRenderer from '../components/NotebookRenderer'
import Loading from '../components/Loading'
import ScrollToTop from '../components/ScrollToTop'

const Browse = () => {
  const { isDark } = useTheme()
  const [structure, setStructure] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useEffect(() => {
    fetchStructure()
  }, [])

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

  const fetchStructure = async () => {
    try {
      const response = await fetch('/api/notebooks')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log('API Response:', result) // Debug log

      if (result.success) {
        setStructure(result.data)
        setError(null)
      } else {
        setError(result.error || 'Unknown error')
        console.error('API Error:', result.error)
      }
    } catch (err) {
      console.error('Error fetching structure:', err)
      console.error('Error details:', err.message)

      // Check if it's a connection error (API server not running)
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('HTTP error! status: 404')) {
        setError('API server is not running. Please start it with: npm run dev:api')
      } else if (err.message.includes('The string did not match the expected pattern')) {
        setError('API server is not running. Please start it with: npm run dev:api')
      } else {
        setError(`Failed to load notebooks: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchFileContent = async (filePath) => {
    setLoadingContent(true)
    try {
      const response = await fetch(`/api/notebook-content?path=${encodeURIComponent(filePath)}`)
      const result = await response.json()
      if (result.success) {
        setFileContent(result)
      }
    } catch (err) {
      console.error('Error fetching file content:', err)
    } finally {
      setLoadingContent(false)
    }
  }

  const handleFileClick = (file) => {
    setSelectedFile(file)
    fetchFileContent(file.path)
    const pathParts = file.path.split('/')
    setBreadcrumbs(pathParts)
  }

  const handleBackToList = () => {
    setSelectedFile(null)
    setFileContent(null)
    setBreadcrumbs([])
  }

  const renderFileList = (items, depth = 0) => {
    return (
      <div className={depth > 0 ? 'ml-6' : ''}>
        {items.map((item, idx) => (
          <div key={idx}>
            {item.type === 'folder' ? (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Folder className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </h3>
                </div>
                {item.children && renderFileList(item.children, depth + 1)}
              </div>
            ) : (
              <button
                onClick={() => handleFileClick(item)}
                className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg
                  bg-white dark:bg-zinc-800/50
                  border border-zinc-200 dark:border-zinc-700
                  hover:border-zinc-300 dark:hover:border-zinc-600
                  hover:shadow-sm
                  transition-all duration-200
                  text-left group"
              >
                {item.extension === '.ipynb' ? (
                  <BookOpen className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                ) : (
                  <FileText className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                )}
                <span className="flex-1 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                  {item.name}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        {breadcrumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <ChevronRight className="w-4 h-4" />}
            <span>{crumb}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderFileContent = () => {
    if (loadingContent) {
      return <Loading />
    }

    if (!fileContent) {
      return null
    }

    if (fileContent.type === 'notebook') {
      return <NotebookRenderer notebook={fileContent.data} />
    }

    if (fileContent.type === 'markdown') {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
          >
            {fileContent.data}
          </ReactMarkdown>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Sticky Title */}
        {showStickyTitle && (
          <div className="fixed top-16 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {selectedFile ? selectedFile.name : 'Browse Notebooks'}
              </h1>
            </div>
          </div>
        )}

        {/* Main Title */}
        <div ref={titleRef} className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {selectedFile ? selectedFile.name : 'Browse Notebooks'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {selectedFile
              ? 'Viewing notebook or markdown file'
              : 'Explore Jupyter notebooks and markdown files'}
          </p>
        </div>

        {/* Back Button */}
        {selectedFile && (
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg
              bg-white dark:bg-zinc-800
              border border-zinc-200 dark:border-zinc-700
              hover:border-zinc-300 dark:hover:border-zinc-600
              transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-zinc-700 dark:text-zinc-300">Back to list</span>
          </button>
        )}

        {/* Breadcrumbs */}
        {selectedFile && renderBreadcrumbs()}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">Error:</p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="mb-12">
          {selectedFile ? renderFileContent() : renderFileList(structure)}
        </div>

        <ScrollToTop />
      </div>
    </div>
  )
}

export default Browse
