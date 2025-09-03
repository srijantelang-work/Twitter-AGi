interface RateLimitInfo {
  endpoint: string
  remaining: number
  resetTime: number
  retryAfter?: number
  limit?: number
}

export class TwitterRateLimiter {
  private rateLimits: Map<string, RateLimitInfo> = new Map()
  private readonly DEFAULT_RETRY_DELAY = 60000 // 1 minute in milliseconds
  private readonly MAX_RETRY_DELAY = 900000 // 15 minutes in milliseconds

  /**
   * Check if we're rate limited for a specific endpoint
   */
  isRateLimited(endpoint: string): boolean {
    const limit = this.rateLimits.get(endpoint)
    if (!limit) {
      return false
    }

    // Check if we have remaining requests
    if (limit.remaining > 0) {
      return false
    }

    // Check if reset time has passed
    if (Date.now() >= limit.resetTime) {
      this.rateLimits.delete(endpoint)
      return false
    }

    return true
  }

  /**
   * Get retry delay for a rate limited endpoint
   */
  getRetryDelay(endpoint: string): number {
    const limit = this.rateLimits.get(endpoint)
    if (!limit || !this.isRateLimited(endpoint)) {
      return 0
    }

    // Calculate time until reset
    const timeUntilReset = limit.resetTime - Date.now()
    
    // Add some buffer time
    return Math.max(timeUntilReset + 5000, this.DEFAULT_RETRY_DELAY)
  }

  /**
   * Update rate limit information from response headers
   */
  updateRateLimit(endpoint: string, headers: Headers): void {
    const remaining = headers.get('x-rate-limit-remaining')
    const reset = headers.get('x-rate-limit-reset')
    const limit = headers.get('x-rate-limit-limit')
    const retryAfter = headers.get('retry-after')

    if (remaining !== null && reset !== null) {
      const resetTime = parseInt(reset) * 1000 // Convert to milliseconds
      const remainingCount = parseInt(remaining)
      
      this.rateLimits.set(endpoint, {
        endpoint,
        remaining: remainingCount,
        resetTime,
        limit: limit ? parseInt(limit) : undefined,
        retryAfter: retryAfter ? parseInt(retryAfter) * 1000 : undefined
      })

      // Log rate limit status
      if (remainingCount < 5) {
        console.warn(`Twitter API rate limit warning for ${endpoint}: ${remainingCount} requests remaining`)
      }
    }
  }

  /**
   * Handle rate limit error and return retry information
   */
  handleRateLimitError(endpoint: string, retryAfter?: number): {
    isRateLimited: boolean
    retryDelay: number
    message: string
  } {
    const now = Date.now()
    let retryDelay = this.DEFAULT_RETRY_DELAY

    if (retryAfter) {
      retryDelay = Math.min(retryAfter * 1000, this.MAX_RETRY_DELAY)
    }

    // Update rate limit info
    this.rateLimits.set(endpoint, {
      endpoint,
      remaining: 0,
      resetTime: now + retryDelay,
      retryAfter: retryDelay
    })

    return {
      isRateLimited: true,
      retryDelay,
      message: `Rate limited. Retry after ${Math.ceil(retryDelay / 1000)} seconds.`
    }
  }

  /**
   * Get current rate limit status for all endpoints
   */
  getRateLimitStatus(): Record<string, RateLimitInfo> {
    return Object.fromEntries(this.rateLimits)
  }

  /**
   * Clear rate limit information for an endpoint
   */
  clearRateLimit(endpoint: string): void {
    this.rateLimits.delete(endpoint)
  }

  /**
   * Check if we should use cached data due to rate limiting
   */
  shouldUseCache(endpoint: string): boolean {
    return this.isRateLimited(endpoint)
  }

  /**
   * Get user-friendly rate limit message
   */
  getRateLimitMessage(endpoint: string): string {
    if (!this.isRateLimited(endpoint)) {
      const limit = this.rateLimits.get(endpoint)
      if (limit) {
        return `API available: ${limit.remaining} requests remaining`
      }
      return 'API is available'
    }

    const retryDelay = this.getRetryDelay(endpoint)
    const minutes = Math.ceil(retryDelay / 60000)
    
    if (minutes < 1) {
      return 'Rate limited. Retrying soon...'
    } else if (minutes === 1) {
      return 'Rate limited. Retry in 1 minute.'
    } else {
      return `Rate limited. Retry in ${minutes} minutes.`
    }
  }

  /**
   * Reset rate limits for testing purposes
   */
  resetAllLimits(): void {
    this.rateLimits.clear()
  }
}
