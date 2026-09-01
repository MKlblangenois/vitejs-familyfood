import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../hooks/useAuth'
import { useSignUp } from '../hooks/useSignUp'
import AuthLayout from '../../../shared/components/AuthLayout'
import { TextInput } from '../../../shared/components/TextInput'

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, 'Le nom d’affichage est requis')
      .max(50, 'Le nom d’affichage est trop long'),
    email: z
      .string()
      .min(1, "L'e-mail est requis")
      .email('Veuillez saisir une adresse e-mail valide'),
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

type RegisterForm = z.infer<typeof registerSchema>

const RegisterPage = () => {
  const { user, loading } = useAuth()
  const signUp = useSignUp()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    signUp.mutate(
      {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      },
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
          Créez votre compte
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
            label="Nom d’affichage"
            id="register-displayName"
            type="text"
            autoComplete="name"
            placeholder="Chef en herbe"
            error={errors.displayName?.message}
            required
            {...register('displayName')}
          />

          <TextInput
            label="Adresse e-mail"
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <TextInput
            label="Mot de passe"
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 caractères"
            error={errors.password?.message}
            required
            {...register('password')}
          />

          <TextInput
            label="Confirmer le mot de passe"
            id="register-confirmPassword"
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
          disabled={isSubmitting}
          className="mt-6 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus:outline-indigo-500"
        >
          {isSubmitting ? 'Création du compte…' : 'Créer un compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Vous avez déjà un compte ?{' '}
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

export default RegisterPage
