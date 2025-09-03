import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TwitterAPIService } from '@/lib/twitter/twitter-api'
import { IntentFiltersService } from '@/lib/database/intent-filters'
import { UserProfilesService } from '@/lib/database/user-profiles'
import { systemLogger } from '@/lib/logging/system-logger'



export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return current rate limit status
    return NextResponse.json({
      message: 'Rate limit status endpoint',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get rate limit status' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    const userProfilesService = new UserProfilesService()
    await userProfilesService.getOrCreateProfile(
      user.id, 
      user.email || '', 
      user.user_metadata?.full_name
    )

    // Get user's intent filters
    const intentService = new IntentFiltersService()
    const userKeywords = await intentService.getUserKeywords(user.id) || []
    
    if (userKeywords.length === 0) {
      // Create a default filter for new users
      try {
        const defaultKeyword = 'startup'
        await intentService.addFilter(user.id, defaultKeyword)
        userKeywords.push(defaultKeyword)
        
        await systemLogger.info('Live Search', 'Created default intent filter for new user', {
          userId: user.id,
          defaultKeyword
        })
      } catch (defaultFilterError) {
        await systemLogger.warn('Live Search', 'Failed to create default filter', {
          userId: user.id,
          error: defaultFilterError
        })
        
        return NextResponse.json({ 
          tweets: [],
          message: 'No intent filters found. Please add some keywords first.',
          suggestion: 'Try adding keywords like "startup", "designer", "developer", etc.',
          action: 'add_filters'
        })
      }
    }

    // Initialize Twitter API service with only the required credentials
    const twitterAPI = new TwitterAPIService({
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: '', // Not needed for Bearer token auth
      accessTokenSecret: '', // Not needed for Bearer token auth
      bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    })

    // Build search query from user keywords
    const searchQuery = userKeywords.map(keyword => `"${keyword}"`).join(' OR ')
    
    // Search Twitter with user's filters
    try {
      const searchResult = await twitterAPI.searchTweets(searchQuery, {
        keywords: userKeywords,
        excludeRetweets: true,
        excludeReplies: false,
        languages: ['en']
      }, 10) // Get up to 10 recent tweets for better performance

      await systemLogger.info('Live Search', 'Twitter search completed', {
        userId: user.id,
        keywords: userKeywords,
        resultCount: searchResult.data?.length || 0
      })

      return NextResponse.json({
        tweets: searchResult.data || [],
        includes: searchResult.includes,
        meta: searchResult.meta,
        searchQuery,
        keywords: userKeywords,
        source: 'twitter_api'
      })
    } catch (error) {
      // Handle rate limiting and other errors gracefully
      if (error instanceof Error) {
        if (error.message.includes('Rate limited') || error.message.includes('429')) {
          await systemLogger.warn('Live Search', 'Twitter API rate limited', {
            userId: user.id,
            keywords: userKeywords,
            error: error.message
          })

          return NextResponse.json({
            tweets: [],
            includes: {},
            meta: { result_count: 0 },
            searchQuery,
            keywords: userKeywords,
            source: 'rate_limited',
            message: 'Twitter API rate limited. Please try again later.',
            retryAfter: '15 minutes',
            error: 'rate_limited'
          }, { status: 429 })
        }

        if (error.message.includes('credentials') || error.message.includes('401')) {
          await systemLogger.error('Live Search', 'Twitter API credentials error', {
            userId: user.id,
            keywords: userKeywords,
            error: error.message
          })

          return NextResponse.json({
            error: 'Twitter API credentials error. Please check your configuration.',
            details: error.message
          }, { status: 401 })
        }
      }

      // Re-throw other errors
      throw error
    }

  } catch (error) {
    await systemLogger.error('Live Search', 'Twitter search failed', { error })
    
    // Return user-friendly error message
    if (error instanceof Error) {
      if (error.message.includes('Twitter API')) {
        return NextResponse.json({ 
          error: 'Twitter API error. Please check your credentials and try again.',
          details: error.message
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to search Twitter. Please try again.',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to search Twitter. Please try again.',
      details: 'Unknown error'
    }, { status: 500 })
  }
}
