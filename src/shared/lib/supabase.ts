import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  string | undefined

if (!supabaseUrl || !supabasePublishableKey) {
  if (import.meta.env.DEV) {
    throw new Error(
      '[FamilyFood] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.',
    )
  }
  console.error(
    '[FamilyFood] Missing Supabase env vars. Supabase features will not work.',
  )
}

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabasePublishableKey ?? '',
)
