import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TwitterAPIService } from '@/lib/twitter/twitter-api'
import { systemLogger } from '@/lib/logging/system-logger'

let twitterAPI: TwitterAPIService | null = null

function getTwitterAPI() {
  if (!twitterAPI) {
    const credentials = {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    }
    
    twitterAPI = new TwitterAPIService(credentials)
  }
  
  return twitterAPI
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    const twitterAPI = getTwitterAPI()

    switch (action) {
      case 'post-tweet':
        const { text } = data
        if (!text) {
          return NextResponse.json(
            { error: 'Tweet text is required' },
            { status: 400 }
          )
        }
        
        try {
          const result = await twitterAPI.postTweet(text)
          await systemLogger.info('Twitter Actions', 'Tweet posted successfully', {
            userId: user.id,
            tweetText: text.substring(0, 50) + '...'
          })
          return NextResponse.json({ success: true, result })
        } catch (error) {
          await systemLogger.error('Twitter Actions', 'Failed to post tweet', {
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return NextResponse.json(
            { error: 'Failed to post tweet', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      case 'reply-tweet':
        const { text: replyText, replyToTweetId } = data
        if (!replyText || !replyToTweetId) {
          return NextResponse.json(
            { error: 'Reply text and tweet ID are required' },
            { status: 400 }
          )
        }
        
        try {
          const result = await twitterAPI.replyToTweet(replyText, replyToTweetId)
          await systemLogger.info('Twitter Actions', 'Tweet reply posted successfully', {
            userId: user.id,
            replyToTweetId,
            replyText: replyText.substring(0, 50) + '...'
          })
          return NextResponse.json({ success: true, result })
        } catch (error) {
          await systemLogger.error('Twitter Actions', 'Failed to post tweet reply', {
            userId: user.id,
            replyToTweetId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return NextResponse.json(
            { error: 'Failed to post reply', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      case 'like-tweet':
        const { tweetId, userId: targetUserId } = data
        if (!tweetId || !targetUserId) {
          return NextResponse.json(
            { error: 'Tweet ID and user ID are required' },
            { status: 400 }
          )
        }
        
        try {
          const result = await twitterAPI.likeTweet(tweetId, targetUserId)
          await systemLogger.info('Twitter Actions', 'Tweet liked successfully', {
            userId: user.id,
            tweetId,
            targetUserId
          })
          return NextResponse.json({ success: true, result })
        } catch (error) {
          await systemLogger.error('Twitter Actions', 'Failed to like tweet', {
            userId: user.id,
            tweetId,
            targetUserId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return NextResponse.json(
            { error: 'Failed to like tweet', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      case 'retweet':
        const { tweetId: retweetId, userId: retweetUserId } = data
        if (!retweetId || !retweetUserId) {
          return NextResponse.json(
            { error: 'Tweet ID and user ID are required' },
            { status: 400 }
          )
        }
        
        try {
          const result = await twitterAPI.retweet(retweetId, retweetUserId)
          await systemLogger.info('Twitter Actions', 'Tweet retweeted successfully', {
            userId: user.id,
            tweetId: retweetId,
            targetUserId: retweetUserId
          })
          return NextResponse.json({ success: true, result })
        } catch (error) {
          await systemLogger.error('Twitter Actions', 'Failed to retweet', {
            userId: user.id,
            tweetId: retweetId,
            targetUserId: retweetUserId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return NextResponse.json(
            { error: 'Failed to retweet', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      case 'search-tweets':
        const { query, filters, maxResults } = data
        if (!query) {
          return NextResponse.json(
            { error: 'Search query is required' },
            { status: 400 }
          )
        }
        
        try {
          const result = await twitterAPI.searchTweets(query, filters || {}, maxResults || 100)
          await systemLogger.info('Twitter Actions', 'Tweet search completed', {
            userId: user.id,
            query,
            resultsCount: result.data?.length || 0
          })
          return NextResponse.json({ success: true, result })
        } catch (error) {
          await systemLogger.error('Twitter Actions', 'Failed to search tweets', {
            userId: user.id,
            query,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return NextResponse.json(
            { error: 'Failed to search tweets', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      case 'get-user-info':
        const { username, userId } = data
        if (!username && !userId) {
          return NextResponse.json(
            { error: 'Username or user ID is required' },
            { status: 400 }
          )
        }
        
        try {
          let result
          if (username) {
            result = await twitterAPI.getUserByUsername(username)
          } else {
            result = await twitterAPI.getUserById(userId)
          }
          
          await systemLogger.info('Twitter Actions', 'User info retrieved successfully', {
            userId: user.id,
            targetUsername: username,
            targetUserId: userId
          })
          return NextResponse.json({ success: true, result })
        } catch (error) {
          await systemLogger.error('Twitter Actions', 'Failed to get user info', {
            userId: user.id,
            targetUsername: username,
            targetUserId: userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return NextResponse.json(
            { error: 'Failed to get user info', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      case 'validate-credentials':
        try {
          const isValid = await twitterAPI.validateCredentials()
          return NextResponse.json({ 
            success: true, 
            valid: isValid,
            message: isValid ? 'Twitter API credentials are valid' : 'Twitter API credentials are invalid'
          })
        } catch (error) {
          await systemLogger.error('Twitter Actions', 'Failed to validate credentials', {
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          return NextResponse.json(
            { error: 'Failed to validate credentials', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Twitter actions API error:', error)
    await systemLogger.error('Twitter Actions API', 'POST request failed', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
