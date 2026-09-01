import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-sand-100 text-forest-600 dark:bg-white/10 dark:text-forest-300">
          {icon}
        </div>
      )}
      <h3 className="font-display text-2xl font-semibold text-ink dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm/6 text-ink-500 dark:text-ink-300">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export default EmptyState
