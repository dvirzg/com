import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Trash2 } from 'lucide-react'

const Block = ({ content, onChange, onEnter, onDelete, onNavigate, isLast, isSelected, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [text, setText] = useState(content)
  const textareaRef = useRef(null)
  const blockRef = useRef(null)

  useEffect(() => {
    setText(content)
  }, [content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      adjustHeight()
    }
  }, [isEditing])

  useEffect(() => {
    if (isSelected && !isEditing && blockRef.current) {
      blockRef.current.focus()
    }
  }, [isSelected, isEditing])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const handleClick = () => {
    onSelect()
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    onChange(text)
  }

  const handleChange = (e) => {
    setText(e.target.value)
    adjustHeight()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onChange(text)
      setIsEditing(false)
      onEnter()
    } else if (e.key === 'Backspace' && text === '' && !isLast) {
      e.preventDefault()
      onDelete()
    }
  }

  const handleBlockKeyDown = (e) => {
    if (e.key === 'Enter' && !isEditing) {
      e.preventDefault()
      setIsEditing(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onNavigate('up')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onNavigate('down')
    } else if (e.key === 'Backspace' && !isEditing && text === '' && !isLast) {
      e.preventDefault()
      onDelete()
    }
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (!isLast) {
      onDelete()
    }
  }

  return (
    <div
      ref={blockRef}
      tabIndex={0}
      className={`relative group outline-none ${isSelected ? 'ring-2 ring-zinc-300 dark:ring-zinc-700 rounded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleBlockKeyDown}
      onClick={onSelect}
    >
      {(isHovered || isEditing || isSelected) && (
        <button
          onClick={handleDeleteClick}
          disabled={isLast}
          className="absolute right-2 top-2 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
          title="Delete block"
        >
          <Trash2 size={14} />
        </button>
      )}

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 pr-10 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none border-l-2 border-zinc-400 dark:border-zinc-600 font-mono text-sm resize-none overflow-hidden"
          placeholder="Type markdown..."
          rows={1}
        />
      ) : (
        <div
          onClick={handleClick}
          className="w-full px-3 py-2 pr-10 min-h-[40px] cursor-text hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors prose prose-zinc dark:prose-invert max-w-none prose-headings:mt-0 prose-headings:mb-0 prose-p:my-0"
        >
          {text ? (
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-bold">{children}</h3>,
                p: ({ children }) => <p className="m-0">{children}</p>,
              }}
            >
              {text}
            </ReactMarkdown>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600 text-sm">Click to add content...</span>
          )}
        </div>
      )}
    </div>
  )
}

const NotionEditor = ({ initialContent, onChange }) => {
  const [blocks, setBlocks] = useState(() => {
    if (!initialContent || initialContent.trim() === '') return ['']
    return initialContent.split('\n\n')
  })
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    onChange(blocks.join('\n\n'))
  }, [blocks, onChange])

  const handleBlockChange = (index, newContent) => {
    const newBlocks = [...blocks]
    newBlocks[index] = newContent
    setBlocks(newBlocks)
  }

  const handleEnter = (index) => {
    const newBlocks = [...blocks]
    newBlocks.splice(index + 1, 0, '')
    setBlocks(newBlocks)
    setSelectedIndex(index + 1)
  }

  const handleDelete = (index) => {
    if (blocks.length === 1) return
    const newBlocks = blocks.filter((_, i) => i !== index)
    setBlocks(newBlocks)
    setSelectedIndex(index > 0 ? index - 1 : 0)
  }

  const handleNavigate = (index, direction) => {
    if (direction === 'up' && index > 0) {
      setSelectedIndex(index - 1)
    } else if (direction === 'down' && index < blocks.length - 1) {
      setSelectedIndex(index + 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {blocks.map((block, index) => (
        <Block
          key={index}
          content={block}
          onChange={(newContent) => handleBlockChange(index, newContent)}
          onEnter={() => handleEnter(index)}
          onDelete={() => handleDelete(index)}
          onNavigate={(direction) => handleNavigate(index, direction)}
          onSelect={() => setSelectedIndex(index)}
          isSelected={selectedIndex === index}
          isLast={blocks.length === 1}
        />
      ))}
    </div>
  )
}

export default NotionEditor
