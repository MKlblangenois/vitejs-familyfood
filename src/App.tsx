import { Route, Routes } from 'react-router-dom'
import AuthGuard from './features/auth/components/AuthGuard'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import HomePage from './features/recipes/pages/HomePage'
import RecipesPage from './features/recipes/pages/RecipesPage'
import RecipeDetailPage from './features/recipes/pages/RecipeDetailPage'
import RecipeCreatePage from './features/recipes/pages/RecipeCreatePage'
import RecipeEditPage from './features/recipes/pages/RecipeEditPage'
import ShoppingListsPage from './features/shopping-lists/pages/ShoppingListsPage'
import ShoppingListDetailPage from './features/shopping-lists/pages/ShoppingListDetailPage'
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
        path="/recipes"
        element={
          <AuthGuard>
            <AppShell>
              <RecipesPage />
            </AppShell>
          </AuthGuard>
        }
      />
      <Route
        path="/recipes/new"
        element={
          <AuthGuard>
            <AppShell>
              <RecipeCreatePage />
            </AppShell>
          </AuthGuard>
        }
      />
      <Route
        path="/recipes/:id"
        element={
          <AuthGuard>
            <AppShell>
              <RecipeDetailPage />
            </AppShell>
          </AuthGuard>
        }
      />
      <Route
        path="/recipes/:id/edit"
        element={
          <AuthGuard>
            <AppShell>
              <RecipeEditPage />
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
        path="/shopping-lists/:id"
        element={
          <AuthGuard>
            <AppShell>
              <ShoppingListDetailPage />
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
