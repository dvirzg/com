import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SublinkRedirect = () => {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchSublink = async () => {
      const { data, error } = await supabase
        .from('sublinks')
        .select('url')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
      } else {
        window.location.href = data.url
      }
    }

    fetchSublink()
  }, [slug])

  if (notFound) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img
            src="/pulses.gif"
            alt="Loading..."
            className="inline-block object-contain dark:invert"
            style={{
              height: '40px',
              imageRendering: 'crisp-edges'
            }}
          />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return null
}

export default SublinkRedirect
