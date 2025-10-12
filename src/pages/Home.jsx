import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const ScrollArrow = () => {
  const { scrollYProgress } = useScroll()
  
  // Transform scroll progress to move arrow up smoothly and fade out
  const arrowY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const arrowScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
      className="absolute bottom-12"
      style={{ 
        y: arrowY, 
        opacity: arrowOpacity,
        scale: arrowScale
      }}
    >
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <ChevronDown className="text-zinc-400 dark:text-zinc-500" size={32} />
      </motion.div>
    </motion.div>
  )
}

const Home = () => {
  return (
    <div className="h-screen overflow-y-scroll bg-white dark:bg-black transition-colors">
      {/* Hero Section */}
      <motion.div 
        className="h-screen flex flex-col items-center justify-center px-6"
        style={{ position: 'relative' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-zinc-900 dark:text-white">
            Hi, I'm Dvir
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300">
            Welcome to my personal website.
          </p>
        </motion.div>

        <ScrollArrow />
      </motion.div>

      {/* Content Section */}
      <div className="h-screen flex flex-col items-center justify-start px-6 pt-30">
        <div className="text-left max-w-4xl w-full">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-zinc-900 dark:text-white">
            About Me
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8">
            ...
          </p>
          
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-zinc-900 dark:text-white">
            Let's Connect
          </h3>
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            Email me at{' '}
            <a href="mailto:dvirzagury@gmail.com" className="text-zinc-900 dark:text-white hover:opacity-80 transition-opacity" style={{ textDecoration: 'underline', textDecorationSkipInk: 'none' }}>
              dvirzagury@gmail.com
            </a>
            {' '}
            or{' '}
            <a href="mailto:dzagury@uwaterloo.ca" className="text-zinc-900 dark:text-white hover:opacity-80 transition-opacity" style={{ textDecoration: 'underline', textDecorationSkipInk: 'none' }}>
              dzagury@uwaterloo.ca
            </a>
            .<br />
            Or connect with me on{' '}
            <a
              href="https://www.dvirzg.com/linkedin"
              className="text-zinc-900 dark:text-white hover:opacity-80 transition-opacity"
              style={{ textDecoration: 'underline', textDecorationSkipInk: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home
