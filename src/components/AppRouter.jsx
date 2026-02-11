import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Home from '../pages/Home'
import Login from '../pages/Login'
import Loading from '../components/Loading'

// Lazy load other pages for better performance
const Notes = lazy(() => import('../pages/Notes'))
const Note = lazy(() => import('../pages/Note'))
const ProfileSetup = lazy(() => import('../pages/ProfileSetup'))
const Editor = lazy(() => import('../pages/Editor'))
const Drafts = lazy(() => import('../pages/Drafts'))
const EditLandingPage = lazy(() => import('../pages/EditLandingPage'))
const AdminPanel = lazy(() => import('../pages/AdminPanel'))
const CustomPage = lazy(() => import('../pages/CustomPage'))
const PageEditor = lazy(() => import('../pages/PageEditor'))
const Career = lazy(() => import('../pages/Career'))
const Tweets = lazy(() => import('../pages/Tweets'))

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
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:id" element={<Note />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/drafts" element={<Drafts />} />
        <Route path="/career" element={<Career />} />
        <Route path="/tweets" element={<Tweets />} />
        <Route path="/edit-landing" element={<EditLandingPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/pages/new" element={<PageEditor />} />
        <Route path="/admin/pages/edit/:slug" element={<PageEditor />} />
        <Route path="/:slug" element={<CustomPage />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
