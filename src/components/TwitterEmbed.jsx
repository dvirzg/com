import { useEffect, useState, useRef, memo } from 'react'

const TwitterEmbed = memo(({ url }) => {
  const [html, setHtml] = useState('')
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return

    loadedRef.current = true
    fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        setHtml(data.html)
        setTimeout(() => {
          if (!window.twttr) {
            const script = document.createElement('script')
            script.src = 'https://platform.twitter.com/widgets.js'
            script.async = true
            document.body.appendChild(script)
          } else {
            window.twttr.widgets.load()
          }
        }, 100)
      })
      .catch(err => console.error('Failed to load tweet:', err))
  }, [url])

  if (!html) return null

  return (
    <div
      className="my-8 flex justify-center"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

TwitterEmbed.displayName = 'TwitterEmbed'

export const isTwitterUrl = (url) => {
  return url && (url.includes('twitter.com') || url.includes('x.com')) && url.includes('/status/')
}

export default TwitterEmbed
