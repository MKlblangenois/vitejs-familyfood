interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'size-4 border-2',
  md: 'size-5 border-2',
  lg: 'size-6 border-[3px]',
}

const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClasses[size]} ${className ?? ''}`}
    />
  )
}

export default Spinner
