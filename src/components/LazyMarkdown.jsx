import { lazy, Suspense } from 'react'

const ReactMarkdown = lazy(() => import('react-markdown'))
const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then(mod => ({ default: mod.Prism }))
)

// Lazy load heavy plugins (for future use)
// const _remarkMath = lazy(() => import('remark-math'))
// const _remarkGfm = lazy(() => import('remark-gfm'))
// const _remarkBreaks = lazy(() => import('remark-breaks'))
// const _rehypeKatex = lazy(() => import('rehype-katex'))

// Import styles lazily
const loadKatexStyles = () => import('katex/dist/katex.min.css')

export const LazyMarkdown = ({ children, components, ...props }) => {
  // Ensure KaTeX styles are loaded when needed
  if (children?.includes('$') || children?.includes('\\')) {
    loadKatexStyles()
  }

  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <ReactMarkdown
        components={components}
        {...props}
      >
        {children}
      </ReactMarkdown>
    </Suspense>
  )
}

export const LazySyntaxHighlighter = ({ children, language, style, ...props }) => {
  return (
    <Suspense fallback={<pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded">{children}</pre>}>
      <SyntaxHighlighter
        language={language}
        style={style}
        {...props}
      >
        {children}
      </SyntaxHighlighter>
    </Suspense>
  )
}
