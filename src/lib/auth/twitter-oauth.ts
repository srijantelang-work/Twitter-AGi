import { createClient } from '@/lib/supabase/client'
import { getOAuthRedirectUrl } from '@/lib/config/oauth-config'

export interface TwitterUserInfo {
  id: string
  username: string
  display_name?: string
  profile_image_url?: string
  description?: string
}

export class TwitterOAuthService {
  private supabase = createClient()

  /**
   * Initiate Twitter OAuth flow using Supabase's built-in OAuth
   */
  async initiateOAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Twitter OAuth Service: Initiating OAuth flow')
      
      // Get the correct redirect URL from configuration
      const redirectUrl = getOAuthRedirectUrl('twitter')
      console.log('Twitter OAuth Service: Using redirect URL:', redirectUrl)
      
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Request additional scopes if needed
            scope: 'tweet.read users.read offline.access'
          }
        }
      })

      if (error) {
        console.error('Twitter OAuth Service: Failed to initiate OAuth', error)
        return { success: false, error: error.message }
      }

      if (data.url) {
        console.log('Twitter OAuth Service: OAuth initiated successfully, redirecting to:', data.url)
        // Redirect to Twitter OAuth
        window.location.href = data.url
        return { success: true }
      } else {
        throw new Error('No OAuth URL received from Supabase')
      }

    } catch (error) {
      console.error('Twitter OAuth Service: Exception during OAuth initiation', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during OAuth initiation' 
      }
    }
  }

  /**
   * Get current user's Twitter OAuth status
   */
  async getOAuthStatus(): Promise<{ 
    isConnected: boolean; 
    user?: TwitterUserInfo; 
    error?: string 
  }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return { isConnected: false }
      }

      // Check if user has Twitter OAuth provider
      const providers = user.app_metadata?.providers || []
      const hasTwitter = providers.includes('twitter')
      
      if (!hasTwitter) {
        return { isConnected: false }
      }

      // Extract Twitter user info from user metadata
      const twitterInfo: TwitterUserInfo = {
        id: user.id,
        username: user.user_metadata?.twitter_username || user.email?.split('@')[0] || 'unknown',
        display_name: user.user_metadata?.full_name || user.user_metadata?.name,
        profile_image_url: user.user_metadata?.avatar_url,
        description: user.user_metadata?.description
      }

      return { 
        isConnected: true, 
        user: twitterInfo 
      }

    } catch (error) {
      console.error('Twitter OAuth Service: Error getting OAuth status', error)
      return { 
        isConnected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Disconnect Twitter OAuth
   */
  async disconnectOAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Twitter OAuth Service: Disconnecting Twitter OAuth')
      
      // For Supabase OAuth, we can't directly disconnect the provider
      // Instead, we'll update user metadata to reflect disconnection
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'No authenticated user found' }
      }

      // Update user metadata to remove Twitter connection info
      const { error: updateError } = await this.supabase.auth.updateUser({
        data: {
          twitter_connected: false,
          twitter_username: null,
          twitter_user_id: null
        }
      })

      if (updateError) {
        console.error('Twitter OAuth Service: Failed to update user metadata', updateError)
        return { success: false, error: updateError.message }
      }

      console.log('Twitter OAuth Service: Successfully disconnected Twitter OAuth')
      
      return { success: true }

    } catch (error) {
      console.error('Twitter OAuth Service: Exception during OAuth disconnection', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during OAuth disconnection' 
      }
    }
  }

  /**
   * Refresh OAuth tokens if needed
   */
  async refreshTokens(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Twitter OAuth Service: Refreshing OAuth tokens')
      
      const { data, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        console.error('Twitter OAuth Service: Failed to refresh tokens', error)
        return { success: false, error: error.message }
      }

      if (data.session) {
        console.log('Twitter OAuth Service: Tokens refreshed successfully')
        return { success: true }
      } else {
        return { success: false, error: 'No session returned after token refresh' }
      }

    } catch (error) {
      console.error('Twitter OAuth Service: Exception during token refresh', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during token refresh' 
      }
    }
  }
}
