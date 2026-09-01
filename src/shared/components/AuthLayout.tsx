interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Tablee
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Votre compagnon de cuisine
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800 dark:shadow-none sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
