import type { ReactNode } from 'react'

type BadgeVariant = 'sage' | 'citrus' | 'tomato' | 'forest' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  sage: 'bg-sage-100 text-sage-700 dark:bg-sage-500/15 dark:text-sage-200',
  citrus: 'bg-citrus-100 text-ink dark:bg-citrus-400/15 dark:text-citrus-300',
  tomato: 'bg-tomato-100 text-tomato-700 dark:bg-tomato-500/15 dark:text-tomato-300',
  forest: 'bg-forest-100 text-forest-700 dark:bg-forest-500/15 dark:text-forest-200',
  neutral: 'bg-sand-100 text-ink-600 dark:bg-white/10 dark:text-ink-200',
}

const Badge = ({ variant = 'neutral', className, children }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className ?? ''}`}
    >
      {children}
    </span>
  )
}

export default Badge
