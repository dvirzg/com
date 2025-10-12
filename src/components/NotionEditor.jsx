import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Trash2, Plus } from 'lucide-react'

const Block = ({ content, onChange, onDelete, onNavigate, onAddBelow, isLast, isSelected, onSelect, isTitle, canDelete }) => {
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

  const finishEditing = () => {
    console.log('finishEditing called with text:', text)
    onChange(text)
    setIsEditing(false)
  }

  const handleBlur = (e) => {
    // Don't blur if clicking the add button
    if (e?.relatedTarget?.classList?.contains('add-block-btn')) {
      return
    }
    // Only finish editing if we're still in editing mode
    if (isEditing) {
      finishEditing()
    }
  }

  const handleChange = (e) => {
    setText(e.target.value)
    adjustHeight()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      finishEditing()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      finishEditing()
      blockRef.current?.focus()
    } else if (e.key === 'Backspace' && text === '') {
      e.preventDefault()
      onDelete()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Allow default behavior when editing - cursor moves within textarea
      return
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
    } else if (e.key === 'Backspace' && !isEditing && text === '') {
      e.preventDefault()
      onDelete()
    }
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    onDelete()
  }

  const handleAddClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onAddBelow()
  }

  return (
    <div
      ref={blockRef}
      tabIndex={0}
      className={`relative group outline-none transition-colors ${isSelected ? 'bg-zinc-50 dark:bg-zinc-900/30' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleBlockKeyDown}
      onClick={onSelect}
    >
      {(isHovered || isEditing || isSelected) && (
        <button
          onClick={handleDeleteClick}
          disabled={!canDelete}
          className="absolute right-2 top-2 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
          title={canDelete ? "Delete block" : "Cannot delete the last block"}
        >
          <Trash2 size={14} />
        </button>
      )}

      {isEditing ? (
        <div className="relative">
          {isTitle && (
            <div className="absolute -top-5 left-3 text-xs text-zinc-500 dark:text-zinc-500">
              Title
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 pr-10 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none border-l-2 border-zinc-400 dark:border-zinc-600 font-mono text-sm resize-none overflow-hidden"
            placeholder={isTitle ? "## Your note title" : "Type markdown..."}
            rows={1}
          />
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full px-3 py-2 pr-10 min-h-[40px] cursor-text hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
        >
          {text ? (
            <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:mt-0 prose-headings:mb-2 prose-p:my-0">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-bold">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-bold">{children}</h3>,
                  h4: ({children}) => <h4 className="text-lg font-bold">{children}</h4>,
                  h5: ({children}) => <h5 className="text-base font-bold">{children}</h5>,
                  h6: ({children}) => <h6 className="text-sm font-bold">{children}</h6>,
                  p: ({children}) => <p className="m-0">{children}</p>,
                  hr: () => <hr className="my-4 border-zinc-300 dark:border-zinc-700" />,
                  img: ({src, alt, title}) => (
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
                  ),
                  a: ({href, children}) => (
                    <a href={href} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  input: ({type, checked}) => {
                    if (type === 'checkbox') {
                      return (
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="mr-2 cursor-not-allowed"
                        />
                      )
                    }
                    return <input type={type} />
                  },
                  table: ({children}) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-700 rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({children}) => <thead className="bg-zinc-50 dark:bg-zinc-800">{children}</thead>,
                  tbody: ({children}) => <tbody>{children}</tbody>,
                  tr: ({children}) => <tr className="border-b border-zinc-200 dark:border-zinc-700">{children}</tr>,
                  th: ({children}) => (
                    <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-3 font-semibold text-left text-zinc-900 dark:text-zinc-100">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {children}
                    </td>
                  ),
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic my-4 text-zinc-700 dark:text-zinc-300">
                      {children}
                    </blockquote>
                  ),
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''
                    
                    if (!inline && language) {
                      return (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={language}
                          PreTag="div"
                          className="rounded-lg my-2"
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
                  pre: ({children}) => (
                    <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded overflow-x-auto my-2">
                      {children}
                    </pre>
                  ),
                  ul: ({children}) => <ul className="list-disc ml-6 my-2">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal ml-6 my-2">{children}</ol>,
                  li: ({children}) => <li className="my-1">{children}</li>,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600 text-sm">
              {isTitle ? 'Click to add title...' : 'Click to add content...'}
            </span>
          )}
        </div>
      )}

      {(isEditing || (isSelected && !isEditing) || isLast) && (
        <div className="flex justify-center py-2">
          <button
            onClick={handleAddClick}
            onMouseDown={(e) => e.preventDefault()}
            className="add-block-btn flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            <Plus size={12} />
            <span>New block</span>
          </button>
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
  }, [blocks])

  const handleBlockChange = (index, newContent) => {
    console.log('handleBlockChange called:', { index, newContent, currentBlocks: blocks })
    const newBlocks = [...blocks]
    newBlocks[index] = newContent
    setBlocks(newBlocks)
  }

  const addNewBlockAfter = (index) => {
    const newBlocks = [...blocks]
    newBlocks.splice(index + 1, 0, '')
    setBlocks(newBlocks)
    setSelectedIndex(index + 1)
  }

  const handleDelete = (index) => {
    // Only allow deletion if there's more than one block
    if (blocks.length <= 1) return
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
          onDelete={() => handleDelete(index)}
          onNavigate={(direction) => handleNavigate(index, direction)}
          onAddBelow={() => addNewBlockAfter(index)}
          onSelect={() => setSelectedIndex(index)}
          isSelected={selectedIndex === index}
          isLast={index === blocks.length - 1}
          isTitle={index === 0 && block.startsWith('##')}
          canDelete={blocks.length > 1}
        />
      ))}
    </div>
  )
}

export default NotionEditor
