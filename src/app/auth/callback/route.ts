import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('OAuth Callback: Processing callback')
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    console.log('OAuth Callback: Received parameters', {
      hasCode: !!code,
      hasError: !!error,
      errorDescription
    })

    // Handle OAuth errors
    if (error) {
      console.error('OAuth Callback: OAuth error received', { error, errorDescription })
              const errorUrl = `/?error=oauth_${error}&details=${encodeURIComponent(errorDescription || 'Unknown OAuth error')}`
      return NextResponse.redirect(new URL(errorUrl, request.url))
    }

    // Handle missing authorization code
    if (!code) {
      console.error('OAuth Callback: No authorization code received')
              return NextResponse.redirect(new URL('/?error=oauth_no_code', request.url))
    }

    // Exchange code for session
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('OAuth Callback: Failed to exchange code for session', exchangeError)
              const errorUrl = `/?error=oauth_exchange_failed&details=${encodeURIComponent(exchangeError.message)}`
      return NextResponse.redirect(new URL(errorUrl, request.url))
    }

    if (!data.session) {
      console.error('OAuth Callback: No session returned after code exchange')
              return NextResponse.redirect(new URL('/?error=oauth_no_session', request.url))
    }

    // Handle Twitter users who don't have email addresses
    if (data.user && !data.user.email && data.user.app_metadata?.provider === 'twitter') {
      console.log('OAuth Callback: Twitter user without email, creating synthetic email')
      
      try {
        // Create a synthetic email for Twitter users
        const twitterUsername = data.user.user_metadata?.twitter_username || 
                              data.user.user_metadata?.screen_name || 
                              data.user.user_metadata?.name ||
                              'twitter_user'
        
        const syntheticEmail = `${twitterUsername}@twitter.oauth`
        
        // Update the user with the synthetic email
        const { error: updateError } = await supabase.auth.updateUser({
          email: syntheticEmail,
          data: {
            twitter_username: twitterUsername,
            twitter_user_id: data.user.user_metadata?.id_str || data.user.id,
            provider: 'twitter',
            email_verified: false // Mark as unverified since it's synthetic
          }
        })
        
        if (updateError) {
          console.error('OAuth Callback: Failed to update Twitter user email', updateError)
          // Continue anyway, the user can still use the app
        } else {
          console.log('OAuth Callback: Successfully created synthetic email for Twitter user', {
            userId: data.user.id,
            syntheticEmail,
            twitterUsername
          })
        }
      } catch (updateError) {
        console.error('OAuth Callback: Error updating Twitter user', updateError)
        // Continue anyway, the user can still use the app
      }
    }

    console.log('OAuth Callback: Successfully authenticated user', {
      userId: data.user?.id,
      email: data.user?.email,
      provider: data.user?.app_metadata?.provider,
      twitterUsername: data.user?.user_metadata?.twitter_username
    })

    // Redirect to dashboard with success parameters
    const dashboardUrl = `/dashboard?success=oauth_connected&provider=${data.user?.app_metadata?.provider || 'unknown'}`
    console.log('OAuth Callback: Redirecting to dashboard', { dashboardUrl })
    
    return NextResponse.redirect(new URL(dashboardUrl, request.url))

  } catch (error) {
    console.error('OAuth Callback: Unexpected error', error)
            const errorUrl = `/?error=oauth_callback_error&details=${encodeURIComponent('Unexpected error during OAuth callback')}`
    return NextResponse.redirect(new URL(errorUrl, request.url))
  }
}
