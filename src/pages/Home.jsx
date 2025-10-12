import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <div className="h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Hi, I'm Dvir
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400">
            I'm a software engineer passionate about building great products.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ChevronDown className="text-zinc-400 dark:text-zinc-600" size={32} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Home
