import { Route, Routes, useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import DetailDrawer from './shared/components/DetailDrawer'
import AuthGuard from './features/auth/components/AuthGuard'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import RecipesPage from './features/recipes/pages/RecipesPage'
import RecipeDetailPage from './features/recipes/pages/RecipeDetailPage'
import RecipeCreatePage from './features/recipes/pages/RecipeCreatePage'
import RecipeEditPage from './features/recipes/pages/RecipeEditPage'
import ShoppingListsPage from './features/shopping-lists/pages/ShoppingListsPage'
import ShoppingListDetailPage from './features/shopping-lists/pages/ShoppingListDetailPage'
import LoyaltyCardsPage from './features/loyalty-cards/pages/LoyaltyCardsPage'
import ProfilePage from './features/profile/pages/ProfilePage'
import AppShell from './shared/components/AppShell'

function App() {
  const location = useLocation()
  const background = (
    location.state as { backgroundLocation?: Location } | null
  )?.backgroundLocation
  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppShell>
                <RecipesPage />
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
          path="/loyalty-cards"
          element={
            <AuthGuard>
              <AppShell>
                <LoyaltyCardsPage />
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
      {background && (
        <Routes>
          <Route
            path="/recipes/:id"
            element={
              <AuthGuard>
                <DetailDrawer title="Fiche recette">
                  <RecipeDetailPage />
                </DetailDrawer>
              </AuthGuard>
            }
          />
          <Route
            path="/shopping-lists/:id"
            element={
              <AuthGuard>
                <DetailDrawer title="Liste de courses">
                  <ShoppingListDetailPage />
                </DetailDrawer>
              </AuthGuard>
            }
          />
        </Routes>
      )}
    </>
  )
}

export default App
