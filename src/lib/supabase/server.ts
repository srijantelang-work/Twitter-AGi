import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  try {
    // Dynamic import to avoid build-time issues
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  } catch (error) {
    // For build-time compatibility, return a mock client
    // This will be replaced at runtime
    console.warn('Failed to create Supabase server client:', error)
    
    // Return a mock client that throws on usage
    return {
      auth: {
        getUser: async () => {
          throw new Error('Supabase client not properly initialized')
        }
      }
    } as ReturnType<typeof createServerClient>
  }
}

// Export a type-safe version for build-time compatibility
export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
