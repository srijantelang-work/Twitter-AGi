import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables (only non-sensitive ones)
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
      TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET,
      TWITTER_API_KEY: !!process.env.TWITTER_API_KEY,
      TWITTER_API_SECRET: !!process.env.TWITTER_API_SECRET,
      TWITTER_BEARER_TOKEN: !!process.env.TWITTER_BEARER_TOKEN,
      TWITTER_CALLBACK_URL: process.env.TWITTER_CALLBACK_URL || 'Not set'
    }

    // Check if required Supabase config is present
    const hasSupabaseConfig = envCheck.NEXT_PUBLIC_SUPABASE_URL && envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasTwitterConfig = envCheck.TWITTER_CLIENT_ID && envCheck.TWITTER_CLIENT_SECRET

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      configuration: {
        supabase: {
          configured: hasSupabaseConfig,
          url: hasSupabaseConfig ? 'Set' : 'Missing',
          anonKey: hasSupabaseConfig ? 'Set' : 'Missing'
        },
        twitter: {
          oauth: {
            configured: hasTwitterConfig,
            clientId: hasTwitterConfig ? 'Set' : 'Missing',
            clientSecret: hasTwitterConfig ? 'Set' : 'Missing'
          },
          api: {
            apiKey: envCheck.TWITTER_API_KEY ? 'Set' : 'Missing',
            apiSecret: envCheck.TWITTER_API_SECRET ? 'Set' : 'Missing',
            bearerToken: envCheck.TWITTER_BEARER_TOKEN ? 'Set' : 'Missing'
          },
          callbackUrl: envCheck.TWITTER_CALLBACK_URL
        }
      },
      recommendations: {
        supabase: hasSupabaseConfig ? '✅ Supabase is properly configured' : '❌ Check Supabase environment variables',
        twitterOAuth: hasTwitterConfig ? '✅ Twitter OAuth is properly configured' : '❌ Check Twitter OAuth environment variables',
        twitterAPI: envCheck.TWITTER_BEARER_TOKEN ? '✅ Twitter API is properly configured' : '❌ Check Twitter API environment variables'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check OAuth configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
