import type { InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
  required?: boolean
}

export const TextInput = ({
  label,
  id,
  error,
  type = 'text',
  required = false,
  className,
  ...inputProps
}: TextInputProps) => {
  const errorId = `${id}-error`

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        {...inputProps}
        className={`mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-xs placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 dark:focus:outline-indigo-500 sm:text-sm/6 ${className ?? ''}`}
      />
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
