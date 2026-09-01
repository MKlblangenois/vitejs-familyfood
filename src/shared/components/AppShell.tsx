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
    <div className="min-h-screen bg-cream dark:bg-ink-950">
      <NetworkStatus />

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pb-8 sm:pt-16 lg:pl-72 lg:pr-8">
        {children}
      </main>

      {/* Single navigation landmark that transforms responsively:
          mobile = floating glass dock, tablet = top bar, desktop = left sidebar */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] sm:top-0 sm:bottom-auto sm:border-b sm:border-sand/60 sm:bg-cream/90 sm:px-6 sm:pt-[env(safe-area-inset-top)] sm:pb-0 sm:backdrop-blur-lg lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-b-0 lg:bg-cream lg:px-0 lg:pt-0 dark:sm:border-white/10 dark:sm:bg-ink-950/90 dark:lg:border-white/10 dark:lg:bg-ink-950"
      >
        <ul className="mx-4 mb-4 flex items-stretch justify-around rounded-[24px] border border-white/40 bg-cream/80 px-2 py-2 shadow-float backdrop-blur-lg sm:mx-auto sm:mb-0 sm:max-w-5xl sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-1 sm:shadow-none sm:backdrop-blur-none lg:mx-0 lg:h-full lg:max-w-none lg:flex-col lg:justify-start lg:gap-1 lg:px-3 lg:py-8 dark:border-white/10 dark:bg-ink-900/80 dark:sm:bg-transparent dark:lg:bg-transparent">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1 sm:flex-none">
              <NavLink
                to={to}
                className={({ isActive }) => {
                  const active =
                    isActive || (to === '/recipes' && location.pathname === '/')
                  return `flex flex-col items-center gap-0.5 rounded-[18px] px-2 py-2.5 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:flex-row sm:gap-2 sm:rounded-control sm:px-4 sm:py-2.5 sm:text-sm lg:py-3 ${
                    active
                      ? 'bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-300'
                      : 'text-ink-400 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 sm:hover:bg-sand/40 dark:sm:hover:bg-white/5'
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
                        className={`size-5 ${
                          active ? 'text-forest dark:text-forest-300' : ''
                        }`}
                      />
                      <span className="text-[10px] leading-tight sm:text-sm sm:leading-normal">
                        {label}
                      </span>
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
