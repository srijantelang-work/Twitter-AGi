import { systemLogger } from '@/lib/logging/system-logger'
import { TwitterCacheService } from '@/lib/cache/twitter-cache'
import { TwitterRateLimiter } from '@/lib/rate-limit/twitter-rate-limiter'

export interface TwitterCredentials {
  apiKey: string
  apiSecret: string
  accessToken: string
  accessTokenSecret: string
  bearerToken?: string
}

export interface TweetFilter {
  keywords: string[]
  authors?: string[]
  languages?: string[]
  excludeRetweets?: boolean
  excludeReplies?: boolean
  minEngagement?: number
}

export interface TweetData {
  id: string
  text: string
  author_id: string
  author_username: string
  created_at: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  lang?: string
  referenced_tweets?: Array<{
    type: 'retweeted' | 'replied_to' | 'quoted'
    id: string
  }>
}

export interface TwitterStreamResponse {
  data: TweetData
  includes?: {
    users?: Array<{
      id: string
      username: string
      name: string
      profile_image_url?: string
    }>
  }
}

export interface TwitterUser {
  id: string
  username: string
  name: string
  profile_image_url?: string
}

export interface TwitterSearchResult {
  data?: TweetData[]
  includes?: {
    users?: TwitterUser[]
  }
  meta?: {
    result_count: number
    next_token?: string
  }
}

export interface TwitterTweetResult {
  data?: TweetData
  includes?: {
    users?: TwitterUser[]
  }
}

export interface TwitterPostResult {
  data: {
    id: string
    text: string
  }
}

export class TwitterAPIService {
  private credentials: TwitterCredentials
  private baseUrl = 'https://api.twitter.com/2'
  private cacheService = new TwitterCacheService()
  private rateLimiter = new TwitterRateLimiter()

  constructor(credentials: TwitterCredentials) {
    this.credentials = credentials
  }

  /**
   * Get OAuth 1.0a signature for Twitter API v1.1 endpoints
   */
  private async getOAuthSignature(): Promise<string> {
    // For Bearer token authentication, we don't need OAuth signature
    if (this.credentials.bearerToken) {
      return `Bearer ${this.credentials.bearerToken}`
    }
    
    // This is a simplified OAuth implementation
    // In production, you'd want to use a proper OAuth library
    
    // For now, we'll use Bearer token authentication which is simpler
    return `Bearer ${this.credentials.bearerToken || ''}`
  }

  /**
   * Make authenticated request to Twitter API
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, string> = {}
  ): Promise<Response> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.credentials.bearerToken || ''}`,
      'Content-Type': 'application/json',
    }

    // Check rate limits
    if (this.rateLimiter.isRateLimited(endpoint)) {
      const retryDelay = this.rateLimiter.getRetryDelay(endpoint)
      const message = this.rateLimiter.getRateLimitMessage(endpoint)
      
      await systemLogger.warn('Twitter API', `Rate limited for ${endpoint}: ${message}`)
      throw new Error(`Rate limited: ${message}`)
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
    })

    // Update rate limit tracking from response headers
    this.rateLimiter.updateRateLimit(endpoint, response.headers)

    if (!response.ok) {
      await this.handleAPIError(response, endpoint)
    }

    return response
  }

  /**
   * Check rate limits before making request
   */
  private async checkRateLimit(endpoint: string): Promise<void> {
    if (this.rateLimiter.isRateLimited(endpoint)) {
      const retryDelay = this.rateLimiter.getRetryDelay(endpoint)
      await systemLogger.warn('Twitter API', `Rate limited for ${endpoint}, waiting ${retryDelay}ms`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  /**
   * Update rate limit tracking from response headers
   */
  private updateRateLimit(endpoint: string, headers: Headers): void {
    this.rateLimiter.updateRateLimit(endpoint, headers)
  }

  /**
   * Handle Twitter API errors with exponential backoff
   */
  private async handleAPIError(response: Response, endpoint: string): Promise<never> {
    const errorData = await response.json().catch(() => ({}))
    const status = response.status

    await systemLogger.error('Twitter API', `API error for ${endpoint}: ${status}`, {
      status,
      endpoint,
      error: errorData
    })

    // Handle specific error cases
    switch (status) {
      case 429: // Rate limited
        const retryAfter = response.headers.get('retry-after')
        const rateLimitInfo = this.rateLimiter.handleRateLimitError(endpoint, retryAfter ? parseInt(retryAfter) : undefined)
        
        await systemLogger.warn('Twitter API', `Rate limited for ${endpoint}`, {
          endpoint,
          retryDelay: rateLimitInfo.retryDelay,
          message: rateLimitInfo.message
        })
        
        throw new Error(`Rate limited: ${rateLimitInfo.message}`)
      
      case 401: // Unauthorized
        throw new Error('Twitter API credentials invalid')
      
      case 403: // Forbidden
        throw new Error('Twitter API access forbidden')
      
      case 500: // Server error
        throw new Error('Twitter API server error')
    }

    throw new Error(`Twitter API error: ${status} ${errorData?.detail || 'Unknown error'}`)
  }

  /**
   * Get user information by username
   */
  async getUserByUsername(username: string): Promise<TwitterUser | null> {
    const response = await this.makeRequest(`/users/by/username/${username}`)
    const result = await response.json() as TwitterUser
    return result || null
  }

  /**
   * Get user information by ID
   */
  async getUserById(userId: string): Promise<TwitterUser | null> {
    const response = await this.makeRequest(`/users/${userId}`)
    const result = await response.json() as TwitterUser
    return result || null
  }

  /**
   * Get tweets by user ID
   */
  async getUserTweets(userId: string, maxResults: number = 100): Promise<TwitterSearchResult> {
    const params: Record<string, string> = {
      'max_results': maxResults.toString(),
      'tweet.fields': 'created_at,public_metrics,lang,referenced_tweets',
      'exclude': 'retweets,replies'
    }

    const response = await this.makeRequest(`/users/${userId}/tweets`, 'GET', params)
    return response.json() as Promise<TwitterSearchResult>
  }

  /**
   * Search tweets with filters
   */
  async searchTweets(query: string, filters: TweetFilter, maxResults: number = 100): Promise<TwitterSearchResult> {
    let searchQuery = query

    // Add filters to search query
    if (filters.excludeRetweets) {
      searchQuery += ' -is:retweet'
    }
    if (filters.excludeReplies) {
      searchQuery += ' -is:reply'
    }
    if (filters.languages && filters.languages.length > 0) {
      searchQuery += ` lang:${filters.languages.join(' OR lang:')}`
    }
    if (filters.authors && filters.authors.length > 0) {
      searchQuery += ` from:${filters.authors.join(' OR from:')}`
    }

    // Check cache first
    const cachedResult = this.cacheService.getCachedResult(filters.keywords || [], searchQuery)
    if (cachedResult && !this.rateLimiter.isRateLimited('/tweets/search/recent')) {
      await systemLogger.info('Twitter API', 'Returning cached search results', {
        query: searchQuery,
        tweetCount: cachedResult.tweets.length,
        cacheAge: Date.now() - cachedResult.cached_at
      })
      
      return {
        data: cachedResult.tweets,
        includes: { users: [] }, // Simplified for cached results
        meta: { result_count: cachedResult.tweets.length }
      }
    }

    // Check if we're rate limited
    if (this.rateLimiter.isRateLimited('/tweets/search/recent')) {
      const retryDelay = this.rateLimiter.getRetryDelay('/tweets/search/recent')
      const message = this.rateLimiter.getRateLimitMessage('/tweets/search/recent')
      
      await systemLogger.warn('Twitter API', 'Rate limited, returning cached data if available', {
        query: searchQuery,
        retryDelay,
        message
      })

      // Return cached data if available, otherwise throw rate limit error
      if (cachedResult) {
        return {
          data: cachedResult.tweets,
          includes: { users: [] },
          meta: { result_count: cachedResult.tweets.length }
        }
      }

      throw new Error(`Rate limited: ${message}`)
    }

    const params: Record<string, string> = {
      'query': searchQuery,
      'max_results': maxResults.toString(),
      'tweet.fields': 'created_at,public_metrics,lang,referenced_tweets,author_id',
      'user.fields': 'username,name,profile_image_url',
      'expansions': 'author_id'
    }

    try {
      const response = await this.makeRequest('/tweets/search/recent', 'GET', params)
      const result = await response.json() as TwitterSearchResult
      
      // Cache the successful result
      if (result.data && result.data.length > 0) {
        this.cacheService.cacheResult(filters.keywords || [], searchQuery, result.data, result.includes)
        await systemLogger.info('Twitter API', 'Cached search results', {
          query: searchQuery,
          tweetCount: result.data.length
        })
      }
      
      return result
    } catch (error) {
      // If API call fails and we have cached data, return it
      if (cachedResult) {
        await systemLogger.warn('Twitter API', 'API call failed, returning cached data', {
          query: searchQuery,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        return {
          data: cachedResult.tweets,
          includes: { users: [] },
          meta: { result_count: cachedResult.tweets.length }
        }
      }
      
      throw error
    }
  }

  /**
   * Get tweet by ID
   */
  async getTweetById(tweetId: string): Promise<TwitterTweetResult> {
    const params: Record<string, string> = {
      'tweet.fields': 'created_at,public_metrics,lang,referenced_tweets,author_id',
      'user.fields': 'username,name,profile_image_url',
      'expansions': 'author_id'
    }

    const response = await this.makeRequest(`/tweets/${tweetId}`, 'GET', params)
    return response.json() as Promise<TwitterTweetResult>
  }

  /**
   * Post a tweet (requires elevated access)
   */
  async postTweet(text: string): Promise<TwitterPostResult> {
    const body = { text }
    const response = await fetch(`${this.baseUrl}/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.bearerToken || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      await this.handleAPIError(response, '/tweets')
    }

    return response.json() as Promise<TwitterPostResult>
  }

  /**
   * Reply to a tweet
   */
  async replyToTweet(text: string, replyToTweetId: string): Promise<TwitterPostResult> {
    const body = { 
      text,
      reply: {
        in_reply_to_tweet_id: replyToTweetId
      }
    }

    const response = await fetch(`${this.baseUrl}/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.bearerToken || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      await this.handleAPIError(response, '/tweets')
    }

    return response.json() as Promise<TwitterPostResult>
  }

  /**
   * Like a tweet
   */
  async likeTweet(tweetId: string, userId: string): Promise<{ data: { liked: boolean } }> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/likes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.bearerToken || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tweet_id: tweetId })
    })

    if (!response.ok) {
      await this.handleAPIError(response, '/users/:id/likes')
    }

    return response.json() as Promise<{ data: { liked: boolean } }>
  }

  /**
   * Retweet a tweet
   */
  async retweet(tweetId: string, userId: string): Promise<{ data: { retweeted: boolean } }> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/retweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.bearerToken || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tweet_id: tweetId })
    })

    if (!response.ok) {
      await this.handleAPIError(response, '/users/:id/retweets')
    }

    return response.json() as Promise<{ data: { retweeted: boolean } }>
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): Record<string, any> {
    return this.rateLimiter.getRateLimitStatus()
  }

  /**
   * Check if credentials are valid
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/users/me')
      return response.ok
    } catch (error) {
      await systemLogger.error('Twitter API', 'Credential validation failed', { error })
      return false
    }
  }
}
