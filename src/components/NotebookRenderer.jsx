import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { useTheme } from '../contexts/ThemeContext'

const NotebookCell = memo(({ cell, isDark }) => {
  const theme = isDark ? oneDark : oneLight

  const renderMarkdownCell = () => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
    return (
      <div className="prose dark:prose-invert max-w-none mb-4">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
        >
          {source}
        </ReactMarkdown>
      </div>
    )
  }

  const renderCodeCell = () => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
    return (
      <div className="mb-6">
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              In [{cell.execution_count || ' '}]:
            </span>
          </div>
          <SyntaxHighlighter
            language="python"
            style={theme}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              background: 'transparent'
            }}
          >
            {source}
          </SyntaxHighlighter>
        </div>
        {cell.outputs && cell.outputs.length > 0 && renderOutputs(cell.outputs)}
      </div>
    )
  }

  const renderOutputs = (outputs) => {
    return (
      <div className="mt-2">
        {outputs.map((output, idx) => (
          <div key={idx} className="mb-2">
            {renderOutput(output)}
          </div>
        ))}
      </div>
    )
  }

  const renderOutput = (output) => {
    // Stream output (stdout/stderr)
    if (output.output_type === 'stream') {
      const text = Array.isArray(output.text) ? output.text.join('') : output.text
      return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
            {text}
          </pre>
        </div>
      )
    }

    // Execute result
    if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
      const data = output.data

      // Image output
      if (data['image/png']) {
        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <img
              src={`data:image/png;base64,${data['image/png']}`}
              alt="Output"
              className="max-w-full h-auto"
            />
          </div>
        )
      }

      // HTML output
      if (data['text/html']) {
        const html = Array.isArray(data['text/html'])
          ? data['text/html'].join('')
          : data['text/html']
        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <div
              className="notebook-html-output"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )
      }

      // Plain text output
      if (data['text/plain']) {
        const text = Array.isArray(data['text/plain'])
          ? data['text/plain'].join('')
          : data['text/plain']
        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
              {text}
            </pre>
          </div>
        )
      }
    }

    // Error output
    if (output.output_type === 'error') {
      const traceback = output.traceback || []
      const errorText = traceback.join('\n')
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap text-red-800 dark:text-red-200">
            {errorText}
          </pre>
        </div>
      )
    }

    return null
  }

  if (cell.cell_type === 'markdown') {
    return renderMarkdownCell()
  } else if (cell.cell_type === 'code') {
    return renderCodeCell()
  }

  return null
})

NotebookCell.displayName = 'NotebookCell'

const NotebookRenderer = ({ notebook }) => {
  const { isDark } = useTheme()
  const cells = useMemo(() => notebook?.cells || [], [notebook])

  return (
    <div className="notebook-renderer max-w-4xl mx-auto">
      {cells.map((cell, idx) => (
        <NotebookCell key={idx} cell={cell} isDark={isDark} />
      ))}
    </div>
  )
}

export default memo(NotebookRenderer)
