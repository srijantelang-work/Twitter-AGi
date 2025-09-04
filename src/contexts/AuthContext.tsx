'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getOAuthRedirectUrl } from '@/lib/config/oauth-config'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (provider: 'google' | 'twitter') => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true'

  const log = useCallback((message: string, data?: unknown) => {
    if (debugMode) {
      console.log(`[AuthContext] ${message}`, data || '')
    }
  }, [debugMode])

  // FIXED: Add authentication state check to prevent redirect loops
  const isAuthenticated = useCallback(() => {
    return !!(user && session)
  }, [user, session])

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        log('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        log('Initial session result:', { session: session?.user?.email, error })
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error in getSession:', error)
      } finally {
        setLoading(false)
        log('Initial session loading complete')
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log('Auth state change:', { event, user: session?.user?.email })
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // FIXED: Handle successful authentication and ensure user profile exists
        if (event === 'SIGNED_IN' && session?.user) {
          log('User signed in successfully', { 
            userId: session.user.id, 
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
            twitterUsername: session.user.user_metadata?.twitter_username
          })
          
          // Check if this is a Twitter OAuth user
          if (session.user.app_metadata?.provider === 'twitter') {
            log('Twitter OAuth user authenticated', { 
              userId: session.user.id,
              twitterUsername: session.user.user_metadata?.twitter_username
            })
          }

          // Ensure user profile exists in database
          try {
            log('Initializing user profile in database...')
            const response = await fetch('/api/init-database', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (response.ok) {
              const result = await response.json()
              log('User profile initialized successfully', result)
            } else {
              log('Failed to initialize user profile', { status: response.status })
            }
          } catch (error) {
            log('Error initializing user profile', error)
          }
        }
        
        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          log('User signed out, redirecting to landing page')
          // Redirect to landing page when user signs out
          window.location.href = '/'
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, log])

  const signIn = async (provider: 'google' | 'twitter') => {
    try {
      log('Starting OAuth sign in...', { provider })
      
      // Get the correct redirect URL from configuration
      const redirectUrl = getOAuthRedirectUrl(provider)
      log('Using redirect URL:', redirectUrl)
      
      const options: {
        redirectTo: string
        queryParams?: {
          scope: string
        }
      } = {
        redirectTo: redirectUrl
      }
      
      // Add Twitter-specific options
      if (provider === 'twitter') {
        options.queryParams = {
          scope: 'tweet.read users.read offline.access'
        }
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options
      })
      
      if (error) {
        console.error('OAuth error:', error)
        throw error
      }
      log('OAuth sign in initiated successfully')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      log('Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      log('Sign out successful')
      
      // Redirect to landing page after successful sign out
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: isAuthenticated()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
