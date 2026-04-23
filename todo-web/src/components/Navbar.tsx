import { Link, NavLink } from 'react-router-dom'
import { LogOut, CheckSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/api/api'
import { useToast } from '@/context/ToastContext'

export function Navbar() {
  const { logout } = useAuth()
  const { showToast } = useToast()

  const handleLogout = async () => {
    try {
      await auth.logout()
    } catch {
      // ignore logout errors — we still clear locally
    }
    logout()
    showToast('Logged out successfully', 'success')
  }

  return (
    <nav className="bg-primary-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/tasks" className="flex items-center gap-2 text-white font-bold text-xl hover:text-primary-100 transition-colors">
            <CheckSquare className="w-6 h-6" />
            TodoApp
          </Link>

          <div className="flex items-center gap-6">
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-white border-b-2 border-white pb-1' : 'text-primary-200 hover:text-white'}`
              }
            >
              Tasks
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-white border-b-2 border-white pb-1' : 'text-primary-200 hover:text-white'}`
              }
            >
              Categories
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-200 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
