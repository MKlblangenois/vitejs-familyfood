import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUpdatePassword } from '../hooks/useUpdatePassword'
import AuthLayout from '../../../shared/components/AuthLayout'
import { TextInput } from '../../../shared/components/TextInput'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

const ResetPasswordPage = () => {
  const updatePassword = useUpdatePassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = (data: ResetPasswordForm) => {
    updatePassword.mutate({ newPassword: data.password })
  }

  if (updatePassword.isSuccess) {
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
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mot de passe mis à jour
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Votre mot de passe a été modifié avec succès.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Aller au tableau de bord
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Définir un nouveau mot de passe
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Choisissez un mot de passe fort pour votre compte.
        </p>

        {updatePassword.isError && (
          <div
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
            role="alert"
          >
            {updatePassword.error?.message ??
              'Une erreur est survenue. Veuillez réessayer.'}
          </div>
        )}

        <div className="space-y-4">
          <TextInput
            label="Nouveau mot de passe"
            id="reset-password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 caractères"
            error={errors.password?.message}
            required
            {...register('password')}
          />

          <TextInput
            label="Confirmer le nouveau mot de passe"
            id="reset-confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />
        </div>

        <button
          type="submit"
          disabled={updatePassword.isPending}
          className="mt-6 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:outline-indigo-500"
        >
          {updatePassword.isPending ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage
