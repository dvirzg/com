import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

const TableOfContents = ({ content }) => {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [collapsed, setCollapsed] = useState({})

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
        <button
          onClick={() => scrollToHeading(heading.id)}
          className={`block w-full text-left py-1.5 text-sm transition-colors ${
            isActive
              ? 'font-semibold text-zinc-900 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {heading.text}
        </button>
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

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wide mb-4">
        Contents
      </div>
      <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
        {hierarchy.map(heading => renderHeading(heading))}
      </div>
    </nav>
  )
}

export default TableOfContents
