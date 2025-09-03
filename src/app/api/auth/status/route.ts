import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return NextResponse.json({
        authenticated: false,
        error: userError.message
      })
    }

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: 'No user found'
      })
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider,
          twitterUsername: user.user_metadata?.twitter_username
        },
        sessionError: sessionError.message
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
        provider: user.app_metadata?.provider,
        twitterUsername: user.user_metadata?.twitter_username,
        twitterUserId: user.user_metadata?.twitter_user_id,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at
      },
      session: {
        accessToken: session?.access_token ? '***' : null,
        refreshToken: session?.refresh_token ? '***' : null,
        expiresAt: session?.expires_at
      }
    })

  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to check authentication status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
