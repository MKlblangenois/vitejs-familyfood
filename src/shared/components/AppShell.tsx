import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import NetworkStatus from './NetworkStatus'
import BrandMark from './BrandMark'

interface NavItem {
  to: string
  label: string
  icon: typeof HomeIcon
}

const navItems: NavItem[] = [
  { to: '/recipes', label: 'Recettes', icon: HomeIcon },
  { to: '/shopping-lists', label: 'Listes de courses', icon: ShoppingBagIcon },
  { to: '/loyalty-cards', label: 'Cartes', icon: CreditCardIcon },
  { to: '/profile', label: 'Profil', icon: UserIcon },
]

interface AppShellProps {
  children: React.ReactNode
}

const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation()

  return (
    <div
      data-vaul-drawer-wrapper=""
      className="bg-cream dark:bg-ink-950 min-h-screen"
    >
      <NetworkStatus />

      <header className="border-forest/10 bg-cream dark:bg-ink-950 relative z-50 border-b dark:border-white/10">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            to="/recipes"
            aria-label="FamilyFood, accueil"
            className="text-forest dark:text-cream flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <BrandMark className="text-sage-500 dark:text-sage-300 size-8" />
            <span className="text-[22px] leading-none font-bold tracking-[-0.06em]">
              family<span className="font-normal">food</span>
              <span className="mt-1 block text-[7px] font-bold tracking-[0.15em]">
                LE PLAISIR DE PARTAGER
              </span>
            </span>
          </Link>
          <span className="text-ink-500 dark:text-ink-300 hidden text-[10px] font-bold tracking-[0.18em] md:block">
            CUISINER · PARTAGER · SAVOURER
          </span>
          <Link
            to="/profile"
            aria-label="Mon profil"
            className="bg-sage-100 text-forest dark:text-sage-200 flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 dark:bg-white/10"
          >
            <UserIcon aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pt-0 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] sm:px-8 sm:pt-14 sm:pb-8 lg:pr-12 lg:pl-72">
        {children}
      </main>

      {/* Single navigation landmark that transforms responsively:
          mobile = floating glass dock, tablet = top bar, desktop = left sidebar */}
      <nav
        aria-label="Navigation principale"
        className="sm:border-sand/60 sm:bg-cream/0 lg:bg-cream dark:sm:bg-ink-950/90 dark:lg:bg-ink-950 fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] sm:top-[76px] sm:bottom-auto sm:border-b sm:px-6 sm:pt-[env(safe-area-inset-top)] sm:pb-0 sm:backdrop-blur-lg lg:inset-x-auto lg:top-[76px] lg:bottom-0 lg:left-0 lg:w-60 lg:border-r lg:border-b-0 lg:px-0 lg:pt-0 dark:sm:border-white/10 dark:lg:border-white/10"
      >
        <ul className="bg-cream/50 shadow-float dark:bg-ink-900/80 mx-4 mb-4 flex items-stretch justify-around rounded-full border border-white/40 px-2 py-2 backdrop-blur sm:mx-auto sm:mb-0 sm:max-w-5xl sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-1 sm:shadow-none sm:backdrop-blur-none lg:mx-0 lg:h-full lg:max-w-none lg:flex-col lg:justify-start lg:gap-1 lg:px-3 lg:py-8 dark:border-white/10 dark:sm:bg-transparent dark:lg:bg-transparent">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1 sm:flex-none">
              <NavLink
                to={to}
                className={({ isActive }) => {
                  const active =
                    isActive || (to === '/recipes' && location.pathname === '/')
                  return `focus-visible:outline-forest sm:rounded-control before:bg-forest relative flex flex-col items-center gap-0.5 rounded-[18px] px-2 py-2.5 text-[10px] font-medium transition-colors before:absolute before:bottom-0 before:left-1/2 before:h-1 before:w-1 before:-translate-x-1/2 before:rounded-full before:opacity-0 before:transition before:duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm lg:py-3 ${
                    active
                      ? 'text-forest dark:text-forest-300 before:opacity-100'
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
                        className={`size-6 ${
                          active ? 'text-forest dark:text-forest-300' : ''
                        }`}
                      />
                      <span className="sr-only text-[10px] leading-tight sm:text-sm sm:leading-normal">
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
