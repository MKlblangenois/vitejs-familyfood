import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../hooks/useAuth'
import { useSignIn } from '../hooks/useSignIn'
import AuthLayout from '../../../shared/components/AuthLayout'
import Button from '../../../shared/components/Button'
import TextField from '../../../shared/components/TextField'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'e-mail est requis")
    .email('Veuillez saisir une adresse e-mail valide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

type LoginForm = z.infer<typeof loginSchema>

const LoginPage = () => {
  const { user, loading } = useAuth()
  const signIn = useSignIn()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    signIn.mutate(
      { email: data.email, password: data.password },
      {
        onError: (error) => {
          setError('root', { message: error.message })
        },
        onSuccess: () => {
          navigate('/', { replace: true })
        },
      },
    )
  }

  if (loading || user) {
    return null
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className="mb-6 text-center text-lg font-semibold text-ink dark:text-white">
          Connectez-vous à votre compte
        </h2>

        {errors.root?.message && (
          <div
            className="mb-4 rounded-control border border-error-200 bg-error-50 p-3 text-sm text-error dark:border-error-700 dark:bg-error/10 dark:text-error-400"
            role="alert"
          >
            {errors.root.message}
          </div>
        )}

        <div className="space-y-4">
          <TextField
            label="Adresse e-mail"
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <TextField
            label="Mot de passe"
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            {...register('password')}
          />
        </div>

        <div className="mt-4 text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-forest-600 hover:text-forest-700 dark:text-forest-300 dark:hover:text-forest-200"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
        Vous n&apos;avez pas de compte ?{' '}
        <Link
          to="/register"
          className="font-medium text-forest-600 hover:text-forest-700 dark:text-forest-300 dark:hover:text-forest-200"
        >
          Créez-en un maintenant
        </Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
