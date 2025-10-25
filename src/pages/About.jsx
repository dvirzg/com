import { useState, useEffect, useRef } from 'react'

const About = () => {
  const [showStickyTitle, setShowStickyTitle] = useState(false)
  const titleRef = useRef(null)

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

  return (
    <>
      {/* Sticky Title Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl transition-all duration-300 ${
        showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
      }`}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">
            About
          </h1>
        </div>
      </div>

      <div className="min-h-screen pt-24 pb-12 px-6 transition-colors">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
              About
            </h1>
          </div>
          <div className="space-y-4">
            <p className="text-lg text-zinc-600 dark:text-zinc-200 leading-relaxed">
              I'm Dvir, this will have my about me.
            </p>
            <p className="text-lg text-zinc-600 dark:text-zinc-200 leading-relaxed">
              It could contain info about my background, my interests, my goals, etc.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default About
