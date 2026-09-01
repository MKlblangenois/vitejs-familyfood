interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

const LoadingSkeleton = ({ className, lines }: LoadingSkeletonProps) => {
  if (lines) {
    return (
      <div className={`space-y-3 ${className ?? ''}`} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded-control bg-sand-200 dark:bg-white/10"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-card bg-sand-200 dark:bg-white/10 ${className ?? ''}`}
    />
  )
}

export default LoadingSkeleton
