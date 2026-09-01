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
    .min(1, "L'e-mail est requis")
    .email('Veuillez saisir une adresse e-mail valide'),
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
            Vérifiez votre e-mail
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Nous avons envoyé un lien de réinitialisation de mot de passe à
            votre adresse e-mail. Suivez les instructions pour créer un nouveau
            mot de passe.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Réinitialisez votre mot de passe
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Saisissez votre e-mail et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </p>

        {resetPassword.isError && (
          <div
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
            role="alert"
          >
            {resetPassword.error?.message ??
              'Une erreur est survenue. Veuillez réessayer.'}
          </div>
        )}

        <TextInput
          label="Adresse e-mail"
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="mt-6 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:outline-indigo-500"
        >
          {resetPassword.isPending ? 'Envoi du lien…' : 'Envoyer le lien de réinitialisation'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Vous vous souvenez de votre mot de passe ?{' '}
        <Link
          to="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
