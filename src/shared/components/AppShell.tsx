import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline'
import NetworkStatus from './NetworkStatus'

interface NavItem {
  to: string
  label: string
  icon: typeof HomeIcon
}

const navItems: NavItem[] = [
  { to: '/recipes', label: 'Recettes', icon: HomeIcon },
  { to: '/shopping-lists', label: 'Listes de courses', icon: ShoppingBagIcon },
  { to: '/profile', label: 'Profil', icon: UserIcon },
]

interface AppShellProps {
  children: React.ReactNode
}

const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NetworkStatus />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-8 sm:pt-16 lg:px-8 lg:pl-72">
        {children}
      </main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-gray-900/90 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b sm:pb-0 sm:pt-[env(safe-area-inset-top)] lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-b-0 lg:pt-0"
      >
        <ul className="mx-auto flex max-w-7xl items-stretch justify-around sm:justify-start sm:gap-2 sm:px-6 lg:mx-0 lg:h-full lg:max-w-none lg:flex-col lg:justify-start lg:gap-1 lg:px-3 lg:py-6">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1 sm:flex-none">
              <NavLink
                to={to}
                className={({ isActive }) => {
                  const active =
                    isActive || (to === '/recipes' && location.pathname === '/')
                  return `flex flex-col items-center gap-1 rounded-md px-4 py-3 text-xs font-medium transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 sm:flex-row sm:gap-2 sm:py-4 sm:text-sm lg:py-3 ${
                    active
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  }`
                }}
              >
                {({ isActive }) => {
                  const active =
                    isActive || (to === '/recipes' && location.pathname === '/')
                  return (
                    <>
                      <Icon
                        aria-hidden="true"
                        className={`size-6 sm:size-5 ${
                          active ? 'text-indigo-600 dark:text-indigo-400' : ''
                        }`}
                      />
                      <span className="sr-only sm:not-sr-only">{label}</span>
                    </>
                  )
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default AppShell
