import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'

const signUpMutation = async (
  email: string,
  password: string,
  displayName: string,
) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error) {
    const message =
      error.message === 'User already registered'
        ? 'Un compte avec cet e-mail existe déjà.'
        : error.message
    throw new Error(message)
  }
}

export const useSignUp = () => {
  return useMutation({
    mutationFn: ({
      email,
      password,
      displayName,
    }: {
      email: string
      password: string
      displayName: string
    }) => signUpMutation(email, password, displayName),
  })
}
