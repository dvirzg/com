import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Trash2, Plus, AlignLeft, AlignCenter, AlignRight, AlignJustify, Image as ImageIcon } from 'lucide-react'
import { uploadMedia, generateMarkdown } from '../lib/mediaUpload'
import { useAuth } from '../contexts/AuthContext'

const Block = ({ content, alignment, onChange, onAlignmentChange, onDelete, onNavigate, onAddBelow, isLast, isSelected, isMultiSelected, onSelect, onMultiSelect, canDelete, isAnyBlockEditing, isAnyBlockSelected, onEditingChange, userId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [text, setText] = useState(content)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showDropZone, setShowDropZone] = useState(false)
  const textareaRef = useRef(null)
  const blockRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(isEditing)
    }
  }, [isEditing])

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

  const handleClick = (e) => {
    // Cmd+click or Ctrl+click for multi-select
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      onMultiSelect()
    } else if (!isSelected && !isMultiSelected) {
      // First click: select the block
      onSelect()
    } else if ((isSelected || isMultiSelected) && !isEditing) {
      // Second click on already selected block: start editing
      setIsEditing(true)
    }
  }

  const handleDoubleClick = () => {
    // Double click: select and start editing immediately
    onSelect()
    setIsEditing(true)
  }

  const finishEditing = () => {
    console.log('finishEditing called with text:', text)
    onChange(text)
    setIsEditing(false)
  }

  const handleBlur = (e) => {
    // Don't blur if clicking the add button or within the drop zone
    if (e?.relatedTarget?.classList?.contains('add-block-btn')) {
      return
    }
    // Check if clicking within the drop zone
    if (e?.relatedTarget && blockRef.current?.contains(e.relatedTarget)) {
      return
    }
    // Only finish editing if we're still in editing mode
    if (isEditing) {
      finishEditing()
      setShowDropZone(false)
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
      // Stop propagation to prevent block navigation when editing
      e.stopPropagation()
      // Allow default textarea behavior for cursor movement
    }
  }

  const handleBlockKeyDown = (e) => {
    if (e.key === 'Enter' && !isEditing) {
      e.preventDefault()
      setIsEditing(true)
    } else if (e.key === 'Escape' && !isEditing) {
      e.preventDefault()
      onSelect(null) // Deselect
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onNavigate('up', e.shiftKey)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onNavigate('down', e.shiftKey)
    } else if (e.key === 'Backspace' && !isEditing && text === '') {
      e.preventDefault()
      onDelete()
    } else if ((e.key === 'n' || e.key === 'N') && !isEditing) {
      e.preventDefault()
      onAddBelow()
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

  const handleFileUpload = async (file) => {
    if (!file) return

    setUploading(true)
    const { url, error } = await uploadMedia(file, userId)

    if (error) {
      alert(`Upload failed: ${error}`)
      setUploading(false)
      return
    }

    // Generate markdown and insert into text
    const markdown = generateMarkdown(url, file.name, file.type)
    const newText = text ? `${text}\n${markdown}` : markdown
    setText(newText)
    onChange(newText)
    setUploading(false)
  }

  const handleImageButtonClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDropZone(!showDropZone)
  }

  const handleBrowseClick = (e) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only hide if leaving the entire drop zone area
    if (e.currentTarget.contains(e.relatedTarget)) return
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setShowDropZone(false)

    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      handleFileUpload(file)
    }
  }

  return (
    <div
      ref={blockRef}
      tabIndex={0}
      className={`relative group outline-none transition-colors ${(isSelected || isMultiSelected) ? 'bg-zinc-50 dark:bg-zinc-900/30' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleBlockKeyDown}
      onClick={onSelect}
    >
      {!isMultiSelected && (isSelected || isEditing || (!isAnyBlockEditing && !isAnyBlockSelected && isHovered)) && (
        <div className="absolute -right-32 top-2 bg-white dark:bg-zinc-900 shadow-lg rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 flex flex-col gap-1 z-10">
          {(isSelected || isEditing) && (
            <>
              <button
                onClick={() => onAlignmentChange('left')}
                className={`p-2 rounded transition-colors ${
                  alignment === 'left'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
                title="Align left"
              >
                <AlignLeft size={16} />
              </button>
              <button
                onClick={() => onAlignmentChange('center')}
                className={`p-2 rounded transition-colors ${
                  alignment === 'center'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
                title="Align center"
              >
                <AlignCenter size={16} />
              </button>
              <button
                onClick={() => onAlignmentChange('right')}
                className={`p-2 rounded transition-colors ${
                  alignment === 'right'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
                title="Align right"
              >
                <AlignRight size={16} />
              </button>
              <button
                onClick={() => onAlignmentChange('justify')}
                className={`p-2 rounded transition-colors ${
                  alignment === 'justify'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
                title="Justify"
              >
                <AlignJustify size={16} />
              </button>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-0.5" />
              <button
                onClick={handleImageButtonClick}
                disabled={uploading}
                className={`p-2 rounded transition-colors disabled:opacity-50 ${
                  showDropZone
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
                title={showDropZone ? "Hide drop zone" : "Show drop zone for media upload"}
              >
                <ImageIcon size={16} />
              </button>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-0.5" />
            </>
          )}
          {!isAnyBlockEditing && (
            <>
              <button
                onClick={handleAddClick}
                onMouseDown={(e) => e.preventDefault()}
                className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                title="Add block below"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={!canDelete}
                className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={canDelete ? "Delete block" : "Cannot delete the last block"}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="relative">
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
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={`w-full px-3 py-2 pr-10 min-h-[40px] cursor-text transition-colors ${
            !isAnyBlockEditing ? 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30' : ''
          }`}
          style={{ textAlign: alignment || 'left' }}
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
                  p: ({children}) => <p className="my-2">{children}</p>,
                  br: () => <br />,
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
                  ol: ({children}) => <ol className="list-decimal ml-6 my-2 marker:text-zinc-900 dark:marker:text-white">{children}</ol>,
                  li: ({children}) => <li className="my-1">{children}</li>,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600 text-sm">
              Click to add content...
            </span>
          )}
        </div>
      )}

      {/* Drop zone - shows when button is clicked and block is selected or editing */}
      {showDropZone && (isSelected || isEditing) && (
        <div
          className="mt-2 p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 transition-colors cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-white rounded-full animate-spin"></div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Uploading...</div>
            </div>
          ) : isDragging ? (
            <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg -m-2 p-8">
              <ImageIcon size={32} className="text-blue-600 dark:text-blue-400" />
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Drop to upload</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-500">
              <ImageIcon size={32} />
              <div className="flex flex-col items-center gap-1">
                <div className="text-sm">Drag and drop images or videos here</div>
                <div className="text-sm">or <span className="text-blue-600 dark:text-blue-400 font-medium">click to browse</span></div>
              </div>
              <div className="text-xs">Max 10MB • JPG, PNG, GIF, WebP, MP4, WebM</div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {isLast && !isSelected && !isEditing && (
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

const NotionEditor = ({ initialContent, initialAlignment, onChange, onAlignmentChange }) => {
  const { user } = useAuth()
  const editorRef = useRef(null)
  const [blocks, setBlocks] = useState(() => {
    if (!initialContent || initialContent.trim() === '') return ['']
    return initialContent.split('\n\n')
  })
  const [alignments, setAlignments] = useState(() => {
    if (!initialAlignment || Object.keys(initialAlignment).length === 0) {
      // Default all blocks to left alignment
      const initialBlocks = !initialContent || initialContent.trim() === '' ? [''] : initialContent.split('\n\n')
      return initialBlocks.map(() => 'left')
    }
    return initialAlignment
  })
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [selectedIndices, setSelectedIndices] = useState(new Set())
  const [editingIndex, setEditingIndex] = useState(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        setSelectedIndex(null)
        setSelectedIndices(new Set())
      }
    }

    const handleKeyDown = (event) => {
      // Cmd+A or Ctrl+A to select all
      if ((event.metaKey || event.ctrlKey) && event.key === 'a' && editingIndex === null) {
        event.preventDefault()
        const allIndices = new Set(blocks.map((_, i) => i))
        setSelectedIndices(allIndices)
        setSelectedIndex(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [blocks, editingIndex])

  useEffect(() => {
    onChange(blocks.join('\n\n'))
  }, [blocks])

  useEffect(() => {
    if (onAlignmentChange) {
      onAlignmentChange(alignments)
    }
  }, [alignments])

  const handleBlockChange = (index, newContent) => {
    console.log('handleBlockChange called:', { index, newContent, currentBlocks: blocks })
    const newBlocks = [...blocks]
    newBlocks[index] = newContent
    setBlocks(newBlocks)
  }

  const handleAlignmentChange = (index, newAlignment) => {
    const newAlignments = [...alignments]
    newAlignments[index] = newAlignment
    setAlignments(newAlignments)
  }

  const addNewBlockAfter = (index) => {
    const newBlocks = [...blocks]
    const newAlignments = [...alignments]
    newBlocks.splice(index + 1, 0, '')
    newAlignments.splice(index + 1, 0, 'left')
    setBlocks(newBlocks)
    setAlignments(newAlignments)
    setSelectedIndex(index + 1)
  }

  const handleDelete = (index) => {
    // Only allow deletion if there's more than one block
    if (blocks.length <= 1) return
    const newBlocks = blocks.filter((_, i) => i !== index)
    const newAlignments = alignments.filter((_, i) => i !== index)
    setBlocks(newBlocks)
    setAlignments(newAlignments)
    setSelectedIndex(index > 0 ? index - 1 : 0)
  }

  const handleNavigate = (index, direction, isShiftKey) => {
    if (isShiftKey) {
      // Shift+arrow: extend selection
      const newIndices = new Set(selectedIndices)
      if (selectedIndex !== null) {
        newIndices.add(selectedIndex)
      }
      newIndices.add(index)

      if (direction === 'up' && index > 0) {
        newIndices.add(index - 1)
      } else if (direction === 'down' && index < blocks.length - 1) {
        newIndices.add(index + 1)
      }

      setSelectedIndices(newIndices)
      if (direction === 'up' && index > 0) {
        setSelectedIndex(index - 1)
      } else if (direction === 'down' && index < blocks.length - 1) {
        setSelectedIndex(index + 1)
      }
    } else {
      // Regular arrow: move selection
      setSelectedIndices(new Set())
      if (direction === 'up' && index > 0) {
        setSelectedIndex(index - 1)
      } else if (direction === 'down' && index < blocks.length - 1) {
        setSelectedIndex(index + 1)
      }
    }
  }

  const handleSelect = (index, deselect) => {
    if (deselect === null) {
      setSelectedIndex(null)
      setSelectedIndices(new Set())
    } else {
      setSelectedIndex(index)
      setSelectedIndices(new Set())
    }
  }

  const handleMultiSelect = (index) => {
    const newIndices = new Set(selectedIndices)
    if (newIndices.has(index)) {
      newIndices.delete(index)
    } else {
      newIndices.add(index)
    }
    setSelectedIndices(newIndices)
    setSelectedIndex(null)
  }

  const handleAlignmentChangeForBlock = (index, newAlignment) => {
    if (selectedIndices.size > 0) {
      // Apply to all selected blocks
      const newAlignments = [...alignments]
      selectedIndices.forEach(i => {
        newAlignments[i] = newAlignment
      })
      setAlignments(newAlignments)
    } else {
      // Apply to single block
      handleAlignmentChange(index, newAlignment)
    }
  }

  const handleEditingChange = (index, isEditing) => {
    if (isEditing) {
      setEditingIndex(index)
    } else if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const isAnyBlockEditing = editingIndex !== null
  const isAnyBlockSelected = selectedIndex !== null || selectedIndices.size > 0

  const handleMultiSelectAlignmentChange = (newAlignment) => {
    const newAlignments = [...alignments]
    selectedIndices.forEach(i => {
      newAlignments[i] = newAlignment
    })
    setAlignments(newAlignments)
  }

  const handleMultiSelectDelete = () => {
    if (selectedIndices.size >= blocks.length) {
      alert('Cannot delete all blocks')
      return
    }
    const newBlocks = blocks.filter((_, i) => !selectedIndices.has(i))
    const newAlignments = alignments.filter((_, i) => !selectedIndices.has(i))
    setBlocks(newBlocks)
    setAlignments(newAlignments)
    setSelectedIndices(new Set())
  }

  return (
    <div ref={editorRef} className="relative">
      {/* Floating toolbar for multi-select */}
      {selectedIndices.size > 1 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-zinc-900 shadow-lg rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 flex gap-2 z-50">
          <div className="flex items-center gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 px-2">
              {selectedIndices.size} selected
            </span>
          </div>
          <button
            onClick={() => handleMultiSelectAlignmentChange('left')}
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Align left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => handleMultiSelectAlignmentChange('center')}
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Align center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => handleMultiSelectAlignmentChange('right')}
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Align right"
          >
            <AlignRight size={16} />
          </button>
          <button
            onClick={() => handleMultiSelectAlignmentChange('justify')}
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Justify"
          >
            <AlignJustify size={16} />
          </button>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <button
            onClick={handleMultiSelectDelete}
            className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-500 transition-colors"
            title="Delete selected blocks"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {blocks.map((block, index) => (
        <Block
          key={index}
          content={block}
          alignment={alignments[index] || 'left'}
          onChange={(newContent) => handleBlockChange(index, newContent)}
          onAlignmentChange={(newAlignment) => handleAlignmentChangeForBlock(index, newAlignment)}
          onDelete={() => handleDelete(index)}
          onNavigate={(direction, isShiftKey) => handleNavigate(index, direction, isShiftKey)}
          onAddBelow={() => addNewBlockAfter(index)}
          onSelect={(deselect) => handleSelect(index, deselect)}
          onMultiSelect={() => handleMultiSelect(index)}
          onEditingChange={(isEditing) => handleEditingChange(index, isEditing)}
          isSelected={selectedIndex === index}
          isMultiSelected={selectedIndices.has(index)}
          isLast={index === blocks.length - 1}
          canDelete={blocks.length > 1}
          isAnyBlockEditing={isAnyBlockEditing && editingIndex !== index}
          isAnyBlockSelected={isAnyBlockSelected && selectedIndex !== index && !selectedIndices.has(index)}
          userId={user?.id}
        />
      ))}
    </div>
  )
}

export default NotionEditor
