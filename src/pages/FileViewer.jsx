import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const FileViewer = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [fileUrl, setFileUrl] = useState(null)
  const [fileType, setFileType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true)
      setError(null)

      // Get sublink data
      const { data: sublink, error: sublinkError } = await supabase
        .from('sublinks')
        .select('type, file_path, url')
        .eq('slug', slug)
        .single()

      if (sublinkError || !sublink) {
        setError('File not found')
        setLoading(false)
        return
      }

      // If it's a URL redirect, navigate there
      if (sublink.type === 'url') {
        window.location.href = sublink.url
        return
      }

      // If it's a file, get the signed URL
      if (sublink.type === 'file' && sublink.file_path) {
        const { data: signedUrlData, error: signedUrlError } = await supabase
          .storage
          .from('sublinks')
          .createSignedUrl(sublink.file_path, 3600) // 1 hour expiry

        if (signedUrlError || !signedUrlData?.signedUrl) {
          setError('Could not load file')
          setLoading(false)
          return
        }

        // Determine file type from extension
        const ext = sublink.file_path.split('.').pop().toLowerCase()
        setFileType(ext)
        setFileUrl(signedUrlData.signedUrl)
      }

      setLoading(false)
    }

    fetchFile()
  }, [slug, navigate])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <div className="text-zinc-500 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:hover:text-white"
          >
            Go home
          </button>
        </div>
      </div>
    )
  }

  // Render based on file type - full screen, covering navbar
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)
  const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileType)
  const isPdf = fileType === 'pdf'

  // For PDFs, add parameters to fit the page in view
  const pdfUrl = isPdf ? `${fileUrl}#view=Fit&toolbar=1` : fileUrl

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-800">
      {isPdf && (
        <iframe
          src={pdfUrl}
          title={slug}
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      )}

      {isImage && (
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
          <img
            src={fileUrl}
            alt={slug}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />
        </div>
      )}

      {isVideo && (
        <div className="w-full h-full flex items-center justify-center">
          <video
            src={fileUrl}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full w-auto h-auto"
          >
            Your browser does not support video playback.
          </video>
        </div>
      )}
    </div>
  )
}

export default FileViewer
