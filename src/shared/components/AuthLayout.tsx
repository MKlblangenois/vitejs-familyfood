interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="bg-cream dark:bg-ink-950 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-forest text-3xl font-bold tracking-tight sm:text-4xl dark:text-white">
            FamilyFood
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-2 text-sm">
            Votre compagnon de cuisine
          </p>
        </div>
        <div className="rounded-card border-sand-200 shadow-card dark:bg-ink-900 sm:rounded-page border bg-white p-6 sm:p-8 dark:border-white/10">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
