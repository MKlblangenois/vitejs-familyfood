import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'

const resetPasswordMutation = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw new Error(error.message)
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => resetPasswordMutation(email),
  })
}
