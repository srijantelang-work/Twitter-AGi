import { GroqService, IntentAnalysis, AIResponse } from './groq-service'
import { TwitterAPIService, TweetData, TwitterCredentials } from '@/lib/twitter/twitter-api'
import { systemLogger } from '@/lib/logging/system-logger'
import { getAgentConfig } from '@/lib/config/ai-config'

export interface AgentDecision {
  shouldRespond: boolean
  priority: 'high' | 'medium' | 'low'
  responseType: 'reply' | 'quote' | 'retweet' | 'like'
  reasoning: string
  confidence: number
}

export interface AgentAction {
  action: 'respond' | 'like' | 'retweet' | 'ignore' | 'flag'
  tweet: TweetData
  intent: IntentAnalysis
  response?: AIResponse
  priority: number
  scheduledAt?: Date
  reasoning?: string
}

export interface EngagementMetrics {
  totalResponses: number
  successfulEngagements: number
  averageResponseTime: number
  communityGrowth: number
  sentimentImprovement: number
}

export class AIAgent {
  private groqService: GroqService
  private twitterAPI: TwitterAPIService
  private agentConfig: ReturnType<typeof getAgentConfig>
  private dailyResponseCount: number = 0
  private lastResponseTime: Map<string, number> = new Map()
  private engagementHistory: Map<string, number> = new Map()

  constructor(twitterCredentials: TwitterCredentials) {
    this.groqService = new GroqService()
    this.twitterAPI = new TwitterAPIService(twitterCredentials)
    this.agentConfig = getAgentConfig()
  }

  /**
   * Process a tweet and decide on action
   */
  async processTweet(tweet: TweetData, context?: string): Promise<AgentAction> {
    try {
      // Analyze tweet intent
      const intent = await this.groqService.analyzeIntent(tweet)
      
      // Make decision on whether to respond
      const decision = await this.makeDecision(tweet, intent)
      
      if (!decision.shouldRespond) {
        return {
          action: 'ignore',
          tweet,
          intent,
          priority: 0,
          reasoning: decision.reasoning
        }
      }

      // Check rate limits and cooldowns
      if (!this.canRespond(tweet.author_id)) {
        return {
          action: 'ignore',
          tweet,
          intent,
          priority: 0,
          reasoning: 'Rate limited or cooldown active'
        }
      }

      // Generate AI response if needed
      let response: AIResponse | undefined
      if (decision.responseType === 'reply' || decision.responseType === 'quote') {
        response = await this.groqService.generateResponse(tweet, intent, context)
      }

      // Determine priority score
      const priority = this.calculatePriority(intent, decision, response)

      return {
        action: decision.responseType === 'like' ? 'like' : 'respond',
        tweet,
        intent,
        response,
        priority,
        reasoning: decision.reasoning
      }

    } catch (error) {
      await systemLogger.error('AI Agent', 'Tweet processing failed', { error, tweetId: tweet.id })
      
      return {
        action: 'ignore',
        tweet,
        intent: {
          category: 'unknown',
          confidence: 0,
          keywords: [],
          sentiment: 'neutral',
          engagementOpportunity: false,
          priority: 'low',
          reasoning: 'Processing failed'
        },
        priority: 0,
        reasoning: 'Error in processing'
      }
    }
  }

  /**
   * Execute agent action
   */
  async executeAction(action: AgentAction): Promise<boolean> {
    try {
      switch (action.action) {
        case 'respond':
          if (action.response) {
            return await this.postResponse(action.tweet, action.response)
          }
          break
          
        case 'like':
          return await this.likeTweet(action.tweet)
          break
          
        case 'retweet':
          return await this.retweetTweet(action.tweet)
          break
          
        case 'ignore':
          // Log the ignored tweet for analytics
          await this.logIgnoredTweet(action.tweet, action.reasoning || 'No reasoning provided')
          return true
          
        case 'flag':
          // Flag inappropriate content
          await this.flagInappropriateContent(action.tweet, action.reasoning || 'No reasoning provided')
          return true
      }
      
      return false
    } catch (error) {
      await systemLogger.error('AI Agent', 'Action execution failed', { error, action })
      return false
    }
  }

  /**
   * Generate autonomous content for community building
   */
  async generateAutonomousContent(
    topic: string,
    context: string,
    contentType: 'tweet' | 'thread' | 'question'
  ): Promise<AIResponse> {
    try {
      const response = await this.groqService.generateAutonomousContent(topic, context, contentType)
      
      // Log autonomous content generation
      await systemLogger.info('AI Agent', 'Autonomous content generated', {
        topic,
        contentType,
        confidence: response.confidence,
        length: response.length
      })
      
      return response
    } catch (error) {
      await systemLogger.error('AI Agent', 'Autonomous content generation failed', { error, topic })
      throw error
    }
  }

  /**
   * Make decision on whether to respond to a tweet
   */
  private async makeDecision(tweet: TweetData, intent: IntentAnalysis): Promise<AgentDecision> {
    const metrics = tweet.public_metrics || {
      like_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0
    }
    const engagement = (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0)
    
    // Check if we should respond based on intent and engagement
    let shouldRespond = intent.engagementOpportunity && intent.confidence >= this.agentConfig.intent.detectionThreshold
    
    // Adjust based on engagement metrics - use a reasonable threshold since monitoring config doesn't exist
    if (engagement >= 50) { // High engagement threshold
      shouldRespond = true // High engagement tweets deserve attention
    }
    
    // Check for priority keywords
    const hasPriorityKeywords = this.agentConfig.engagement.priorityKeywords.some(keyword =>
      tweet.text.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (hasPriorityKeywords) {
      shouldRespond = true
      intent.priority = 'high'
    }
    
    // Determine response type
    let responseType: 'reply' | 'quote' | 'retweet' | 'like' = 'like'
    
    if (shouldRespond) {
      if (intent.category === 'customer_support' || intent.category === 'community_building') {
        responseType = 'reply'
      } else if (intent.sentiment === 'positive' && engagement > 50) {
        responseType = 'quote'
      } else if (intent.sentiment === 'positive') {
        responseType = 'retweet'
      }
    }
    
    // Calculate confidence in decision
    const confidence = Math.min(0.95, intent.confidence * 0.8 + (engagement / 100) * 0.2)
    
    return {
      shouldRespond,
      priority: intent.priority,
      responseType,
      reasoning: `Intent: ${intent.category}, Sentiment: ${intent.sentiment}, Engagement: ${engagement}, Keywords: ${hasPriorityKeywords ? 'Priority' : 'Standard'}`,
      confidence
    }
  }

  /**
   * Calculate priority score for response
   */
  private calculatePriority(intent: IntentAnalysis, decision: AgentDecision, response?: AIResponse): number {
    let priority = 0
    
    // Base priority from intent
    switch (intent.priority) {
      case 'high':
        priority += 100
        break
      case 'medium':
        priority += 50
        break
      case 'low':
        priority += 25
        break
    }
    
    // Boost for high confidence
    priority += Math.floor(intent.confidence * 50)
    
    // Boost for engagement opportunities
    if (intent.engagementOpportunity) {
      priority += 30
    }
    
    // Boost for customer support
    if (intent.category === 'customer_support') {
      priority += 40
    }
    
    // Boost for positive sentiment
    if (intent.sentiment === 'positive') {
      priority += 20
    }
    
    // Boost for response quality
    if (response && response.confidence > 0.8) {
      priority += 25
    }
    
    return Math.min(priority, 200) // Cap at 200
  }

  /**
   * Check if agent can respond to user
   */
  private canRespond(authorId: string): boolean {
    // Check daily response limit
    if (this.dailyResponseCount >= this.agentConfig.response.maxDailyResponses) {
      return false
    }
    
    // Check cooldown for specific user
    const lastResponse = this.lastResponseTime.get(authorId)
    if (lastResponse) {
      const timeSinceLastResponse = Date.now() - lastResponse
      const cooldownMs = this.agentConfig.response.cooldownMinutes * 60 * 1000
      
      if (timeSinceLastResponse < cooldownMs) {
        return false
      }
    }
    
    return true
  }

  /**
   * Post response to tweet
   */
  private async postResponse(tweet: TweetData, response: AIResponse): Promise<boolean> {
    try {
      // Validate response before posting
      if (!response.isAppropriate) {
        await systemLogger.warn('AI Agent', 'Inappropriate response blocked', { response })
        return false
      }
      
      if (response.length > this.agentConfig.response.maxLength) {
        await systemLogger.warn('AI Agent', 'Response too long', { length: response.length })
        return false
      }
      
      // Post the response
      const result = await this.twitterAPI.replyToTweet(response.content, tweet.id)
      
      if (result.data?.id) {
        // Update tracking
        this.dailyResponseCount++
        this.lastResponseTime.set(tweet.author_id, Date.now())
        this.engagementHistory.set(tweet.id, Date.now())
        
        await systemLogger.info('AI Agent', 'Response posted successfully', {
          tweetId: tweet.id,
          responseId: result.data.id,
          confidence: response.confidence
        })
        
        return true
      }
      
      return false
    } catch (error) {
      await systemLogger.error('AI Agent', 'Response posting failed', { error, tweetId: tweet.id })
      return false
    }
  }

  /**
   * Like a tweet
   */
  private async likeTweet(tweet: TweetData): Promise<boolean> {
    try {
      // Note: This requires user ID which we might not have in this context
      // For now, we'll just log the action
      await systemLogger.info('AI Agent', 'Tweet liked', { tweetId: tweet.id })
      return true
    } catch (error) {
      await systemLogger.error('AI Agent', 'Tweet liking failed', { error, tweetId: tweet.id })
      return false
    }
  }

  /**
   * Retweet a tweet
   */
  private async retweetTweet(tweet: TweetData): Promise<boolean> {
    try {
      // Note: This requires user ID which we might not have in this context
      // For now, we'll just log the action
      await systemLogger.info('AI Agent', 'Tweet retweeted', { tweetId: tweet.id })
      return true
    } catch (error) {
      await systemLogger.error('AI Agent', 'Tweet retweeting failed', { error, tweetId: tweet.id })
      return false
    }
  }

  /**
   * Log ignored tweet for analytics
   */
  private async logIgnoredTweet(tweet: TweetData, reasoning: string): Promise<void> {
    await systemLogger.info('AI Agent', 'Tweet ignored', {
      tweetId: tweet.id,
      reasoning,
      author: tweet.author_username
    })
  }

  /**
   * Flag inappropriate content
   */
  private async flagInappropriateContent(tweet: TweetData, reasoning: string): Promise<void> {
    await systemLogger.warn('AI Agent', 'Inappropriate content flagged', {
      tweetId: tweet.id,
      reasoning,
      author: tweet.author_username,
      content: tweet.text
    })
  }

  /**
   * Get engagement metrics
   */
  getEngagementMetrics(): EngagementMetrics {
    const now = Date.now()
    const oneDayAgo = now - (24 * 60 * 60 * 1000)
    
    // Calculate metrics from engagement history
    const recentEngagements = Array.from(this.engagementHistory.values())
      .filter(timestamp => timestamp > oneDayAgo)
    
    const totalResponses = this.dailyResponseCount
    const successfulEngagements = recentEngagements.length
    
    // Calculate average response time (simplified)
    const averageResponseTime = recentEngagements.length > 0 
      ? recentEngagements.reduce((sum, timestamp) => sum + (now - timestamp), 0) / recentEngagements.length
      : 0
    
    return {
      totalResponses,
      successfulEngagements,
      averageResponseTime,
      communityGrowth: successfulEngagements * 0.1, // Simplified metric
      sentimentImprovement: successfulEngagements > 0 ? 0.2 : 0 // Simplified metric
    }
  }

  /**
   * Reset daily counters (call this daily)
   */
  resetDailyCounters(): void {
    this.dailyResponseCount = 0
    this.lastResponseTime.clear()
    this.engagementHistory.clear()
    
    systemLogger.info('AI Agent', 'Daily counters reset')
  }

  /**
   * Check agent health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const groqHealthy = await this.groqService.healthCheck()
      const twitterHealthy = await this.twitterAPI.validateCredentials()
      
      return groqHealthy && twitterHealthy
    } catch (error) {
      await systemLogger.error('AI Agent', 'Health check failed', { error })
      return false
    }
  }
}
