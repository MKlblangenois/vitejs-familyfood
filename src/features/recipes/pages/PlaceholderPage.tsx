const PlaceholderPage = ({ title }: { title: string }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-gray-500 dark:text-gray-400">
        Coming soon. This feature is under construction.
      </p>
    </div>
  )
}

export default PlaceholderPage
