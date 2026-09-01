import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'

const signInMutation = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const message =
      error.message === 'Invalid login credentials'
        ? 'E-mail ou mot de passe invalide. Veuillez réessayer.'
        : error.message
    throw new Error(message)
  }
}

export const useSignIn = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInMutation(email, password),
  })
}
