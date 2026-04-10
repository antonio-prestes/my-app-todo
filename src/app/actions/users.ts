"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: { name: string, avatar_url: string }) {
  const supabase = await createClient()

  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Não autorizado" }
  }

  // 2. Update Supabase Auth Metadata
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: { 
      display_name: data.name,
      avatar_url: data.avatar_url 
    }
  })
  if (updateAuthError) {
    console.error("Server Action Auth Update Error:", updateAuthError)
    return { error: updateAuthError.message }
  }

  // 3. Update Database Record
  const { error: dbError } = await supabase
    .from('users')
    .update({ 
      name: data.name, 
      avatar_url: data.avatar_url 
    })
    .eq('id', user.id)

  if (dbError) {
    console.error("Server Action DB Update Error:", dbError)
    return { error: dbError.message }
  }

  // 4. Revalidate cache
  revalidatePath('/', 'layout')
  
  return { success: true }
}
