import { createServerClient } from '@supabase/ssr'

// Create a more robust server client that handles build-time issues
export async function createClient() {
  // Check if we're in a build environment
  if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase environment variables not configured')
  }

  try {
    // Dynamic import to avoid build-time issues in Vercel
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
    // If we can't create the client (e.g., during build), return a mock
    // This will be replaced at runtime
    console.warn('Failed to create Supabase server client:', error)
    
    return {
      auth: {
        getUser: async () => {
          throw new Error('Supabase client not properly initialized - this is expected during build time')
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => {
              throw new Error('Supabase client not properly initialized - this is expected during build time')
            }
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => {
                  throw new Error('Supabase client not properly initialized - this is expected during build time')
                }
              })
            })
          })
        })
      })
    } as ReturnType<typeof createServerClient>
  }
}

// Export a type-safe version
export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
