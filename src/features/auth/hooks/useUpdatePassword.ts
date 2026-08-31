import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'

const updatePasswordMutation = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: ({ newPassword }: { newPassword: string }) =>
      updatePasswordMutation(newPassword),
  })
}
