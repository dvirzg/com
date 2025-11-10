import { useEffect, useRef } from 'react'

const TwitterEmbed = ({ url }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    // Load Twitter widget script if not already loaded
    if (!window.twttr) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      document.body.appendChild(script)
    }

    // Wait for script to load and create embed
    const checkAndEmbed = () => {
      if (window.twttr?.widgets && containerRef.current) {
        containerRef.current.innerHTML = ''
        window.twttr.widgets.createTweet(
          extractTweetId(url),
          containerRef.current,
          { theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' }
        )
      } else {
        setTimeout(checkAndEmbed, 100)
      }
    }

    checkAndEmbed()
  }, [url])

  return <div ref={containerRef} className="my-8 mx-auto max-w-2xl" />
}

const extractTweetId = (url) => {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}

export const isTwitterUrl = (url) => {
  return url && (url.includes('twitter.com') || url.includes('x.com')) && url.includes('/status/')
}

export default TwitterEmbed
