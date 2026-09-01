import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResetPassword } from '../hooks/useResetPassword'
import AuthLayout from '../../../shared/components/AuthLayout'
import Button from '../../../shared/components/Button'
import TextField from '../../../shared/components/TextField'

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
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sage-50 dark:bg-sage-500/10">
            <svg
              className="size-6 text-forest dark:text-sage-400"
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
          <h2 className="text-lg font-semibold text-ink dark:text-white">
            Vérifiez votre e-mail
          </h2>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
            Nous avons envoyé un lien de réinitialisation de mot de passe à
            votre adresse e-mail. Suivez les instructions pour créer un nouveau
            mot de passe.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-medium text-forest-600 hover:text-forest-700 dark:text-forest-300 dark:hover:text-forest-200"
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
        <h2 className="mb-2 text-center text-lg font-semibold text-ink dark:text-white">
          Réinitialisez votre mot de passe
        </h2>
        <p className="mb-6 text-center text-sm text-ink-500 dark:text-ink-300">
          Saisissez votre e-mail et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </p>

        {resetPassword.isError && (
          <div
            className="mb-4 rounded-control border border-error-200 bg-error-50 p-3 text-sm text-error dark:border-error-700 dark:bg-error/10 dark:text-error-400"
            role="alert"
          >
            {resetPassword.error?.message ??
              'Une erreur est survenue. Veuillez réessayer.'}
          </div>
        )}

        <TextField
          label="Adresse e-mail"
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
          disabled={resetPassword.isPending}
          isLoading={resetPassword.isPending}
        >
          {resetPassword.isPending ? 'Envoi du lien…' : 'Envoyer le lien de réinitialisation'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
        Vous vous souvenez de votre mot de passe ?{' '}
        <Link
          to="/login"
          className="font-medium text-forest-600 hover:text-forest-700 dark:text-forest-300 dark:hover:text-forest-200"
        >
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
