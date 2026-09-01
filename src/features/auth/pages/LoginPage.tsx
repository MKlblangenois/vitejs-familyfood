import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../hooks/useAuth'
import { useSignIn } from '../hooks/useSignIn'
import AuthLayout from '../../../shared/components/AuthLayout'
import { TextInput } from '../../../shared/components/TextInput'

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
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Connectez-vous à votre compte
        </h2>

        {errors.root?.message && (
          <div
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
            role="alert"
          >
            {errors.root.message}
          </div>
        )}

        <div className="space-y-4">
          <TextInput
            label="Adresse e-mail"
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <TextInput
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
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:outline-indigo-500"
        >
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Vous n&apos;avez pas de compte ?{' '}
        <Link
          to="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Créez-en un maintenant
        </Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
