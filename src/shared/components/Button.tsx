import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'citrus' | 'destructive' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  icon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-forest text-white hover:bg-forest-700 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400',
  secondary:
    'border border-sand-200 bg-cream text-ink hover:bg-sand-100 focus-visible:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:outline-forest-400',
  citrus:
    'bg-citrus text-ink hover:bg-citrus-300 focus-visible:outline-citrus-600 dark:bg-citrus-400 dark:hover:bg-citrus-300 dark:focus-visible:outline-citrus-300',
  destructive:
    'bg-error text-white hover:bg-error-700 focus-visible:outline-error-700 dark:bg-error-600 dark:hover:bg-error-500 dark:focus-visible:outline-error-400',
  ghost:
    'bg-transparent text-ink hover:bg-sand-100 focus-visible:outline-forest-600 dark:text-white dark:hover:bg-white/10 dark:focus-visible:outline-forest-400',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'gap-1.5 rounded-control px-3 py-1.5 text-sm',
  md: 'gap-2 rounded-control px-4 py-2.5 text-sm',
  lg: 'gap-2 rounded-control px-5 py-3 text-base',
}

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  type = 'button',
  disabled,
  className,
  children,
  ...buttonProps
}: ButtonProps) => {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      disabled={isDisabled}
      {...buttonProps}
      className={`inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`}
    >
      {isLoading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : (
        icon && (
          <span aria-hidden="true" className="shrink-0">
            {icon}
          </span>
        )
      )}
      {children}
    </button>
  )
}

export default Button
