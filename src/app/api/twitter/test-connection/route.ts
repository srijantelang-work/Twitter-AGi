import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TwitterAPIService } from '@/lib/twitter/twitter-api'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check environment variables
    const envCheck = {
      TWITTER_API_KEY: !!process.env.TWITTER_API_KEY,
      TWITTER_API_SECRET: !!process.env.TWITTER_API_SECRET,
      TWITTER_BEARER_TOKEN: !!process.env.TWITTER_BEARER_TOKEN,
      hasRequiredCredentials: !!(process.env.TWITTER_BEARER_TOKEN)
    }

    if (!envCheck.hasRequiredCredentials) {
      return NextResponse.json({
        error: 'Missing required Twitter API credentials',
        envCheck,
        message: 'Please check your .env.local file for TWITTER_BEARER_TOKEN'
      }, { status: 400 })
    }

    // Initialize Twitter API service
    const twitterAPI = new TwitterAPIService({
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: '',
      accessTokenSecret: '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    })

    // Test with a simple search
    try {
      const testResult = await twitterAPI.searchTweets('test', {
        keywords: ['test'],
        excludeRetweets: true,
        excludeReplies: false,
        languages: ['en']
      }, 1) // Just get 1 tweet for testing

      await systemLogger.info('Test Connection', 'Twitter API connection successful', {
        userId: user.id,
        resultCount: testResult.data?.length || 0
      })

      return NextResponse.json({
        success: true,
        message: 'Twitter API connection successful',
        testResult: {
          tweetCount: testResult.data?.length || 0,
          hasData: !!testResult.data,
          meta: testResult.meta
        },
        envCheck
      })
    } catch (apiError) {
      await systemLogger.error('Test Connection', 'Twitter API test failed', { 
        userId: user.id,
        error: apiError 
      })

      return NextResponse.json({
        success: false,
        error: 'Twitter API test failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        envCheck
      }, { status: 500 })
    }

  } catch (error) {
    await systemLogger.error('Test Connection', 'Connection test failed', { error })
    
    return NextResponse.json({ 
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
