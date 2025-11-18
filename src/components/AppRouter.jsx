import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Home from '../pages/Home'
import Notes from '../pages/Notes'
import Note from '../pages/Note'
import Login from '../pages/Login'
import ProfileSetup from '../pages/ProfileSetup'
import Editor from '../pages/Editor'
import Drafts from '../pages/Drafts'
import EditLandingPage from '../pages/EditLandingPage'
import AdminPanel from '../pages/AdminPanel'
import CustomPage from '../pages/CustomPage'
import PageEditor from '../pages/PageEditor'
import Career from '../pages/Career'
import Loading from '../components/Loading'

const AppRouter = () => {
  const { user, loading, isProfileComplete } = useAuth()

  // Show loading while checking auth status
  if (loading) {
    return <Loading />
  }

  // If user is logged in but profile is not complete, show profile setup
  if (user && !isProfileComplete()) {
    return <ProfileSetup />
  }

  // Otherwise, show the normal routes
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/notes/:id" element={<Note />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/drafts" element={<Drafts />} />
      <Route path="/career" element={<Career />} />
      <Route path="/edit-landing" element={<EditLandingPage />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin/pages/new" element={<PageEditor />} />
      <Route path="/admin/pages/edit/:slug" element={<PageEditor />} />
      <Route path="/:slug" element={<CustomPage />} />
    </Routes>
  )
}

export default AppRouter
