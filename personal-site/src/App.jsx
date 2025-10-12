import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotesProvider } from './contexts/NotesContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import Notes from './pages/Notes'
import Note from './pages/Note'
import Login from './pages/Login'
import Editor from './pages/Editor'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotesProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/notes/:id" element={<Note />} />
                <Route path="/login" element={<Login />} />
                <Route path="/editor" element={<Editor />} />
              </Routes>
            </div>
          </BrowserRouter>
        </NotesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
