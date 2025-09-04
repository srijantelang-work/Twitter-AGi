import { TweetData, TwitterUser } from '@/lib/twitter/twitter-api'

interface CachedTweet {
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
  cached_at: number
  expires_at: number
}

interface CachedSearchResult {
  tweets: CachedTweet[]
  keywords: string[]
  searchQuery: string
  cached_at: number
  expires_at: number
}

export class TwitterCacheService {
  private cache: Map<string, CachedSearchResult> = new Map()
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 100 // Maximum number of cached searches

  /**
   * Generate a cache key for a search query
   */
  private generateCacheKey(keywords: string[], searchQuery: string): string {
    const sortedKeywords = [...keywords].sort().join(',')
    return `${sortedKeywords}:${searchQuery}`
  }

  /**
   * Check if cached data exists and is still valid
   */
  getCachedResult(keywords: string[], searchQuery: string): CachedSearchResult | null {
    const cacheKey = this.generateCacheKey(keywords, searchQuery)
    const cached = this.cache.get(cacheKey)

    if (!cached) {
      return null
    }

    // Check if cache has expired
    if (Date.now() > cached.expires_at) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached
  }

  /**
   * Store search results in cache
   */
  cacheResult(keywords: string[], searchQuery: string, tweets: TweetData[], includes?: { users?: TwitterUser[] }): void {
    const cacheKey = this.generateCacheKey(keywords, searchQuery)
    const now = Date.now()

    // Transform tweets to include author information
    const transformedTweets: CachedTweet[] = tweets.map(tweet => {
      const author = includes?.users?.find((u: TwitterUser) => u.id === tweet.author_id)
      return {
        ...tweet,
        author_username: author?.username || 'unknown',
        cached_at: now,
        expires_at: now + this.CACHE_DURATION
      }
    })

    const cachedResult: CachedSearchResult = {
      tweets: transformedTweets,
      keywords,
      searchQuery,
      cached_at: now,
      expires_at: now + this.CACHE_DURATION
    }

    // Implement LRU cache eviction
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(cacheKey, cachedResult)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Clear expired cache entries
   */
  cleanupExpired(): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires_at) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    return cleanedCount
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Check if we should use cache based on rate limiting
   */
  shouldUseCache(keywords: string[], searchQuery: string): boolean {
    const cached = this.getCachedResult(keywords, searchQuery)
    if (!cached) {
      return false
    }

    // Use cache if it's less than 5 minutes old (fresher content)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    return cached.cached_at > fiveMinutesAgo
  }
}
