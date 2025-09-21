
import { useEffect, useState } from 'react'
import './App.css'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { useAuth } from './context/AuthContext'
import { Moon, Sun } from 'lucide-react'
import { Button } from './components/ui/button'
import { Navigate, Route, Routes } from 'react-router'
import { Dashboard } from './components/dashboard/Dashboard'
import { CalendarView } from './components/calender/CalendarView'
import { Sidebar } from './components/layout/Sidebar'
import TaskView from './components/tasks/TaskView'
import MoodView from './components/mood/MoodView'
import { GoalsView } from './components/goals/GoalsView'
import { JournalView } from './components/journal/JournalView'


//fallback auth page
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}

//theme toggle
function Layout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true) //dark mode by default

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme === "dark") {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    } else {
      setIsDark(false)
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev
      if (newTheme) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
      return newTheme
    })
  }

  return (
    <div className={`min-h-screen bg-background ${isDark ? "dark" : ""}`}>
      <div className="flex">
        <Sidebar />

        <main className="flex-1 md:ml-0">
          {/* Header */}
          <header className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="ml-12 md:ml-0">
                <h2 className="text-2xl font-bold capitalize">Plannerly</h2>
                <p className="text-muted-foreground">Organize your life and boost productivity</p>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <Layout>{children}</Layout>
}


function App() {
  return (
    <>

      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TaskView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <JournalView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <GoalsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mood"
          element={
            <ProtectedRoute>
              <MoodView />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  )
}

export default App
