import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div
            className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 dark:border-gray-600 dark:border-t-indigo-400"
            role="status"
          >
            <span className="sr-only">Loading…</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default AuthGuard
