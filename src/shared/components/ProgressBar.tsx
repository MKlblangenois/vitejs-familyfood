interface ProgressBarProps {
  value: number
  className?: string
}

const ProgressBar = ({ value, className }: ProgressBarProps) => {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 w-full overflow-hidden rounded-pill bg-sand-200 dark:bg-white/10 ${className ?? ''}`}
    >
      <div
        className="h-full rounded-pill bg-citrus transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export default ProgressBar
