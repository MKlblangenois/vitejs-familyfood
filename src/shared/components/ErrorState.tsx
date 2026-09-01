import Button from './Button'

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
}

const ErrorState = ({ title, description, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-error-200 bg-error-50 px-6 py-12 text-center dark:border-error-500/20 dark:bg-error-500/10">
      <h3 className="font-display text-xl font-semibold text-error-700 dark:text-error-300">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm/6 text-ink-600 dark:text-ink-300">
          {description}
        </p>
      )}
      {onRetry && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onRetry}
          className="mt-6"
        >
          Réessayer
        </Button>
      )}
    </div>
  )
}

export default ErrorState
