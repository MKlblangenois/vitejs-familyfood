const ProfilePage = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-display text-3xl font-bold text-ink dark:text-white sm:text-4xl">
        Profil
      </h1>
      <div className="mt-6 w-full max-w-md rounded-card border border-sand-200 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-ink-900">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sage-50 dark:bg-sage-500/10">
          <svg
            className="size-6 text-forest dark:text-sage-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
        <p className="text-sm text-ink-600 dark:text-ink-200">
          Votre profil arrive bientôt. Restez à l&apos;écoute !
        </p>
      </div>
    </div>
  )
}

export default ProfilePage
