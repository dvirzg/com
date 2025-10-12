import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotesProvider } from './contexts/NotesContext'
import Navbar from './components/Navbar'
import AppRouter from './components/AppRouter'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotesProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors">
              <Navbar />
              <AppRouter />
            </div>
          </BrowserRouter>
        </NotesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
