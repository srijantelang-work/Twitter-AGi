/**
 * OAuth Configuration for Supabase
 * 
 * This file contains configuration for OAuth providers that are enabled in Supabase.
 * To enable Twitter OAuth:
 * 
 * 1. Go to your Supabase dashboard
 * 2. Navigate to Authentication > Providers
 * 3. Enable Twitter provider
 * 4. Add your Twitter API credentials:
 *    - API Key (Consumer Key)
 *    - API Secret (Consumer Secret)
 * 5. Set the callback URL to: https://your-domain.com/auth/callback
 */

export const OAUTH_CONFIG = {
  twitter: {
    enabled: true,
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    redirectUrl: '/auth/callback'
  },
  google: {
    enabled: true,
    scopes: ['openid', 'profile', 'email'],
    redirectUrl: '/auth/callback'
  }
}

export const getOAuthRedirectUrl = (provider: string): string => {
  // Use the callback URL from environment if available, otherwise fall back to localhost
  const baseUrl = process.env.TWITTER_CALLBACK_URL 
    ? process.env.TWITTER_CALLBACK_URL.replace('/auth/twitter/callback', '')
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  
  const config = OAUTH_CONFIG[provider as keyof typeof OAUTH_CONFIG]
  
  if (!config) {
    throw new Error(`OAuth provider '${provider}' not configured`)
  }
  
  const fullUrl = `${baseUrl}${config.redirectUrl}`
  console.log(`🔗 Generated OAuth redirect URL for ${provider}:`, fullUrl)
  
  return fullUrl
}
