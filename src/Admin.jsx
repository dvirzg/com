import { useEffect, useState } from 'react'
import { BarChart3, ExternalLink, FileText, Trash2, Upload } from 'lucide-react'
import { supabase } from './lib/supabase'

const input = 'w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white'
const primary = 'px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity disabled:opacity-50'
const secondary = 'text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors'

const toSlug = (s) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

function Admin() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  if (user === undefined) return null

  return (
    <div className="h-dvh overflow-y-auto bg-white dark:bg-black text-zinc-900 dark:text-white">
      <div className={`max-w-3xl mx-auto px-6 py-16 ${user?.user_metadata?.is_admin === true ? '' : 'min-h-full flex flex-col justify-center'}`}>
        {!user ? (
          <Login />
        ) : user.user_metadata?.is_admin !== true ? (
          <div className="text-center space-y-4">
            <p>This account is not an admin.</p>
            <button onClick={() => supabase.auth.signOut()} className={secondary}>Sign out</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold">Links</h1>
              <div className="flex gap-4">
                <a href="/" className={secondary}>Home</a>
                <button onClick={() => supabase.auth.signOut()} className={secondary}>Sign out</button>
              </div>
            </div>
            <Links />
          </>
        )}
      </div>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = useMagicLink
      ? await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/admin` } })
      : await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) alert(error.message)
    else if (useMagicLink) setSent(true)
  }

  if (sent) return <p className="text-center">Magic link sent. Check your email.</p>

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Login</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={input} />
      {!useMagicLink && (
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className={input} />
      )}
      <button type="submit" disabled={loading} className={`${primary} w-full py-3`}>
        {loading ? '...' : useMagicLink ? 'Send magic link' : 'Login'}
      </button>
      <button type="button" onClick={() => setUseMagicLink(!useMagicLink)} className={`${secondary} block mx-auto`}>
        {useMagicLink ? 'Use password instead' : 'Use magic link instead'}
      </button>
    </form>
  )
}

function Links() {
  const [links, setLinks] = useState([])
  const [views, setViews] = useState({})
  const [openSlug, setOpenSlug] = useState(null)

  const load = async () => {
    const [{ data: linkData }, { data: viewData }] = await Promise.all([
      supabase.from('sublinks').select('*').order('created_at', { ascending: false }),
      supabase.from('file_views').select('slug, viewed_at, country, city, device_type, referer').order('viewed_at', { ascending: false }).limit(2000),
    ])
    setLinks(linkData || [])
    const bySlug = {}
    for (const v of viewData || []) (bySlug[v.slug] ||= []).push(v)
    setViews(bySlug)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (link) => {
    if (!confirm(`Delete /${link.slug}?`)) return
    if (link.file_path) await supabase.storage.from('sublinks').remove([link.file_path])
    const { error } = await supabase.from('sublinks').delete().eq('id', link.id)
    if (error) alert(error.message)
    load()
  }

  return (
    <div className="space-y-6">
      <AddLink existing={links} onSaved={load} />
      {links.length === 0 && <p className="text-zinc-500">No links yet.</p>}
      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.id} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <a href={`/${link.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono text-sm font-medium">
                  /{link.slug}
                  {link.type === 'file' ? <FileText size={14} className="text-blue-500" /> : <ExternalLink size={14} className="text-zinc-400" />}
                </a>
                <p className="text-sm text-zinc-500 truncate">{link.type === 'file' ? link.file_path : link.url}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setOpenSlug(openSlug === link.slug ? null : link.slug)} className="flex items-center gap-1 p-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800" title="Views">
                  <BarChart3 size={16} /> {views[link.slug]?.length || 0}
                </button>
                <button onClick={() => handleDelete(link)} className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {openSlug === link.slug && <ViewList views={views[link.slug] || []} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function ViewList({ views }) {
  if (!views.length) return <p className="mt-3 text-sm text-zinc-500">No views yet.</p>
  return (
    <ul className="mt-3 max-h-64 overflow-y-auto text-sm divide-y divide-zinc-200 dark:divide-zinc-800">
      {views.map((v) => (
        <li key={v.viewed_at} className="py-2 flex justify-between gap-4 text-zinc-600 dark:text-zinc-300">
          <span>{new Date(v.viewed_at).toLocaleString()}</span>
          <span className="truncate">{[v.city, v.country].filter(Boolean).join(', ') || 'Unknown'} · {v.device_type || '?'}</span>
        </li>
      ))}
    </ul>
  )
}

function AddLink({ existing, onSaved }) {
  const [type, setType] = useState('url')
  const [slugInput, setSlugInput] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    if (!/^(application\/pdf|image\/|video\/)/.test(dropped.type)) return alert('Please drop a PDF, image, or video')
    setFile(dropped)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const slug = toSlug(slugInput)
    if (!slug || slug === 'admin') return alert('Invalid slug')
    if (type === 'file' && !file) return alert('Please choose a file')
    const current = existing.find((l) => l.slug === slug)
    if (current && !confirm(`/${slug} already points to ${current.file_path || current.url}. Replace it?`)) return

    setSaving(true)
    let record = { slug, type, url, file_path: null }
    if (type === 'file') {
      const filePath = `files/${slug}.${file.name.split('.').pop().toLowerCase()}`
      const { error } = await supabase.storage.from('sublinks').upload(filePath, file, { upsert: true })
      if (error) {
        setSaving(false)
        return alert(`Upload failed: ${error.message}`)
      }
      record = { ...record, url: `/${slug}`, file_path: filePath }
    }

    const { error } = current
      ? await supabase.from('sublinks').update(record).eq('id', current.id)
      : await supabase.from('sublinks').insert(record)
    setSaving(false)
    if (error) return alert(error.message)
    // Only remove the old file once the replacement is saved
    if (current?.file_path && current.file_path !== record.file_path) {
      await supabase.storage.from('sublinks').remove([current.file_path])
    }
    setSlugInput('')
    setUrl('')
    setFile(null)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex gap-4 text-sm">
        {['url', 'file'].map((t) => (
          <label key={t} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={type === t} onChange={() => setType(t)} />
            {t === 'url' ? 'URL' : 'File'}
          </label>
        ))}
      </div>
      <input value={slugInput} onChange={(e) => setSlugInput(e.target.value)} placeholder={type === 'file' ? 'resume' : 'slug'} required className={input} />
      <p className="text-xs text-zinc-500">{window.location.origin}/{toSlug(slugInput)}</p>
      {type === 'url' ? (
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required className={input} />
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed cursor-pointer text-sm transition-colors ${dragging ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-900' : 'border-zinc-300 dark:border-zinc-700'}`}
        >
          {file ? <FileText size={18} /> : <Upload size={18} />}
          {file ? file.name : 'Drop a PDF, image, or video here, or click to choose'}
          <input type="file" accept="application/pdf,image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="sr-only" />
        </label>
      )}
      <button type="submit" disabled={saving} className={primary}>{saving ? 'Saving...' : 'Add link'}</button>
    </form>
  )
}

export default Admin
