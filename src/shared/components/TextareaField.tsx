import type { TextareaHTMLAttributes } from 'react'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  id: string
  error?: string
  hint?: string
}

const TextareaField = ({
  label,
  id,
  error,
  hint,
  className,
  ...textareaProps
}: TextareaFieldProps) => {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : undefined, hint ? hintId : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-ink-700 dark:text-ink-200"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : undefined}
        {...textareaProps}
        className={`${label ? 'mt-1' : ''} block w-full rounded-control border border-sand-200 bg-cream px-3 py-2 text-ink placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-400 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 sm:text-sm/6 ${className ?? ''}`}
      />
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-error dark:text-error-400"
          role="alert"
        >
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          {hint}
        </p>
      )}
    </div>
  )
}

export default TextareaField
