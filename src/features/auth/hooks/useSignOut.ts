import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../../shared/lib/supabase'

const signOutMutation = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export const useSignOut = () => {
  return useMutation({
    mutationFn: signOutMutation,
  })
}
