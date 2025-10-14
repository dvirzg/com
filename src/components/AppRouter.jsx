import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Home from '../pages/Home'
import About from '../pages/About'
import Notes from '../pages/Notes'
import Note from '../pages/Note'
import Login from '../pages/Login'
import ProfileSetup from '../pages/ProfileSetup'
import Editor from '../pages/Editor'
import Drafts from '../pages/Drafts'
import Sublinks from '../pages/Sublinks'
import SublinkRedirect from '../pages/SublinkRedirect'
import EditLandingPage from '../pages/EditLandingPage'

const AppRouter = () => {
  const { user, loading, isProfileComplete } = useAuth()

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    )
  }

  // If user is logged in but profile is not complete, show profile setup
  if (user && !isProfileComplete()) {
    return <ProfileSetup />
  }

  // Otherwise, show the normal routes
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/notes/:id" element={<Note />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/drafts" element={<Drafts />} />
      <Route path="/sublinks" element={<Sublinks />} />
      <Route path="/edit-landing" element={<EditLandingPage />} />
      <Route path="/:slug" element={<SublinkRedirect />} />
    </Routes>
  )
}

export default AppRouter
