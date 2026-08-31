import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResetPassword } from '../hooks/useResetPassword'
import AuthLayout from '../../../shared/components/AuthLayout'
import { TextInput } from '../../../shared/components/TextInput'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

const ForgotPasswordPage = () => {
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordForm) => {
    resetPassword.mutate({ email: data.email })
  }

  if (resetPassword.isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
            <svg
              className="size-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            We&apos;ve sent a password reset link to your email address. Follow
            the instructions to create a new password.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Reset your password
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>

        {resetPassword.isError && (
          <div
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
            role="alert"
          >
            {resetPassword.error?.message ??
              'Something went wrong. Please try again.'}
          </div>
        )}

        <TextInput
          label="Email address"
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="mt-6 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:outline-indigo-500"
        >
          {resetPassword.isPending ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Remember your password?{' '}
        <Link
          to="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
