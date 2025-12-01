import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordLogin, setIsPasswordLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isPasswordLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert(error.message)
      } else {
        // Successful login
        navigate('/')
      }
    } else {
      // Use the current origin (supports both localhost and production)
      const redirectUrl = window.location.origin

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        alert(error.message)
      } else {
        setSent(true)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-zinc-900 dark:text-zinc-100">
          {sent ? 'Check your email' : 'Login'}
        </h1>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              Magic link sent.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors underline"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                placeholder="you@example.com"
              />
            </div>

            {isPasswordLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isPasswordLogin}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                  placeholder="••••••••"
                />
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50"
            >
              {loading ? (isPasswordLogin ? 'Logging in...' : 'Sending...') : (isPasswordLogin ? 'Login' : 'Send magic link')}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsPasswordLogin(!isPasswordLogin)}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {isPasswordLogin ? 'Use magic link instead' : 'Use password instead'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default Login
