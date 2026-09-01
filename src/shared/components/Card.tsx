import type { ElementType, ReactNode } from 'react'

interface CardProps {
  as?: ElementType
  className?: string
  children: ReactNode
  interactive?: boolean
}

const Card = ({
  as: Tag = 'div',
  className,
  children,
  interactive = false,
}: CardProps) => {
  return (
    <Tag
      className={`rounded-card border border-sand-200 bg-white shadow-card dark:border-white/10 dark:bg-forest-900 ${
        interactive
          ? 'transition-transform hover:-translate-y-0.5 hover:shadow-float'
          : ''
      } ${className ?? ''}`}
    >
      {children}
    </Tag>
  )
}

export default Card
