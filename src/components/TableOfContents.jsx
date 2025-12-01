import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, X } from 'lucide-react'

const TableOfContents = ({ content }) => {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Extract headings from markdown content - matching Note.jsx's block-based approach
    const extractHeadings = () => {
      if (!content) return []

      const blocks = content.split('\n\n')
      const headingRegex = /^(#{1,6})\s+(.+)$/m
      const extractedHeadings = []

      blocks.forEach((block, blockIndex) => {
        const lines = block.split('\n')
        const firstLine = lines[0]
        const match = firstLine.match(headingRegex)

        if (match) {
          const level = match[1].length
          let text = match[2].trim()

          // Store original text for ID generation (matching Note.jsx)
          const originalText = text

          // Remove markdown formatting from display text only
          text = text
            .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold **text**
            .replace(/\*(.+?)\*/g, '$1')      // Remove italic *text*
            .replace(/__(.+?)__/g, '$1')      // Remove bold __text__
            .replace(/_(.+?)_/g, '$1')        // Remove italic _text_
            .replace(/`(.+?)`/g, '$1')        // Remove inline code `text`
            .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links [text](url)
            .replace(/~~(.+?)~~/g, '$1')      // Remove strikethrough ~~text~~

          // Generate ID matching Note.jsx exactly - using block index and original text
          const id = `heading-${blockIndex}-${originalText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

          extractedHeadings.push({
            level,
            text,
            id,
            index: blockIndex
          })
        }
      })

      return extractedHeadings
    }

    setHeadings(extractHeadings())
  }, [content])

  useEffect(() => {
    if (headings.length === 0) return

    const handleScroll = () => {
      // Get all heading elements and their positions
      const headingElements = headings
        .map(({ id }) => {
          const element = document.getElementById(id)
          if (!element) return null
          const rect = element.getBoundingClientRect()
          return {
            id,
            top: rect.top
          }
        })
        .filter(Boolean)

      // Find the last heading that has passed the top of the screen (with some offset for navbar)
      // This means you're currently reading that section's content
      const offset = 150 // Account for navbar and some padding

      let currentHeading = null

      // Iterate through headings and find the last one that's above the offset line
      for (let i = 0; i < headingElements.length; i++) {
        const heading = headingElements[i]
        if (heading.top <= offset) {
          currentHeading = heading.id
        } else {
          // Once we find a heading below the offset, we stop
          break
        }
      }

      // If no heading has passed the top yet, highlight the first one
      if (!currentHeading && headingElements.length > 0) {
        currentHeading = headingElements[0].id
      }

      if (currentHeading) {
        setActiveId(currentHeading)
      }
    }

    // Run on mount and scroll
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -100
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const toggleCollapse = (id) => {
    setCollapsed(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Auto-expand/collapse based on active heading
  useEffect(() => {
    if (!activeId || headings.length === 0) return

    const hierarchy = buildHierarchy(headings)

    // Find path to active heading
    const findPath = (items, targetId, path = []) => {
      for (const item of items) {
        if (item.id === targetId) {
          return [...path, item.id]
        }
        if (item.children && item.children.length > 0) {
          const found = findPath(item.children, targetId, [...path, item.id])
          if (found) return found
        }
      }
      return null
    }

    const activePath = findPath(hierarchy, activeId)

    if (activePath) {
      // Collapse all, then expand only the path to active
      const newCollapsed = {}

      // First, collapse all headings that have children
      const collapseAll = (items) => {
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            newCollapsed[item.id] = true
            collapseAll(item.children)
          }
        })
      }
      collapseAll(hierarchy)

      // Then expand the path to active heading (but not the active heading itself)
      activePath.slice(0, -1).forEach(id => {
        newCollapsed[id] = false
      })

      setCollapsed(newCollapsed)
    }
  }, [activeId, headings])

  // Build hierarchical structure
  const buildHierarchy = (headings) => {
    const hierarchy = []
    const stack = []

    headings.forEach((heading) => {
      const item = { ...heading, children: [] }

      // Pop stack until we find a parent with lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop()
      }

      if (stack.length === 0) {
        hierarchy.push(item)
      } else {
        stack[stack.length - 1].children.push(item)
      }

      stack.push(item)
    })

    return hierarchy
  }

  const renderHeading = (heading, depth = 0) => {
    const hasChildren = heading.children && heading.children.length > 0
    const isCollapsed = collapsed[heading.id]
    const isActive = activeId === heading.id

    return (
      <div key={heading.id}>
        <div className="flex items-center gap-1">
          {hasChildren && (
            <button
              onClick={() => toggleCollapse(heading.id)}
              className="flex-shrink-0 p-0.5 hover:text-zinc-900 dark:hover:text-white transition-colors"
              style={{ marginLeft: `${depth * 12}px` }}
            >
              {isCollapsed ? (
                <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-600" />
              ) : (
                <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-600" />
              )}
            </button>
          )}
          <button
            onClick={() => scrollToHeading(heading.id)}
            className={`block flex-1 text-left py-1.5 text-sm transition-colors ${
              isActive
                ? 'font-semibold text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            style={{ paddingLeft: hasChildren ? '0px' : `${depth * 12 + 18}px` }}
          >
            {heading.text}
          </button>
        </div>
        {hasChildren && !isCollapsed && (
          <div>
            {heading.children.map(child => renderHeading(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const hierarchy = buildHierarchy(headings)

  if (headings.length === 0) {
    return null
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed left-8 top-24 px-3 py-2 text-xs font-medium text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white uppercase tracking-wide border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors xl:block hidden"
      >
        Contents
      </button>
    )
  }

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wide">
          Contents
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:text-zinc-900 dark:hover:text-white text-zinc-400 dark:text-zinc-600 transition-colors xl:block hidden"
          title="Hide table of contents"
        >
          <X size={14} />
        </button>
      </div>
      <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
        {hierarchy.map(heading => renderHeading(heading))}
      </div>
    </nav>
  )
}

export default TableOfContents
