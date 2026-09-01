interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 dark:bg-ink-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-forest dark:text-white sm:text-4xl">
            Tablee
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
            Votre compagnon de cuisine
          </p>
        </div>
        <div className="rounded-card border border-sand-200 bg-white p-6 shadow-card dark:border-white/10 dark:bg-ink-900 sm:rounded-page sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
