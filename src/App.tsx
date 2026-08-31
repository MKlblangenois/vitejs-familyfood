import { Route, Routes } from 'react-router-dom'
import AuthGuard from './features/auth/components/AuthGuard'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import HomePage from './features/recipes/pages/HomePage'
import ShoppingListsPage from './features/shopping-lists/pages/ShoppingListsPage'
import ProfilePage from './features/profile/pages/ProfilePage'
import AppShell from './shared/components/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <AppShell>
              <HomePage />
            </AppShell>
          </AuthGuard>
        }
      />
      <Route
        path="/shopping-lists"
        element={
          <AuthGuard>
            <AppShell>
              <ShoppingListsPage />
            </AppShell>
          </AuthGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthGuard>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </AuthGuard>
        }
      />
    </Routes>
  )
}

export default App
