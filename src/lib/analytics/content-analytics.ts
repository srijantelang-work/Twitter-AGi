/**
 * Content Performance Analytics
 * 
 * Tracks content performance, engagement metrics, and provides
 * insights for content optimization for the AI Superconnector brand.
 */

import { createClient } from '@/lib/supabase/client'
import { systemLogger } from '@/lib/logging/system-logger'

export interface ContentPerformanceMetrics {
  contentId: string
  likesCount: number
  retweetsCount: number
  repliesCount: number
  impressions: number
  engagementRate: number
  performanceScore: number
  trackedAt: Date
}

export interface ContentAnalytics {
  totalContent: number
  averageEngagementRate: number
  topPerformingContent: ContentPerformanceMetrics[]
  contentTypePerformance: Record<string, number>
  hashtagPerformance: Record<string, number>
  timeSlotPerformance: Record<string, number>
  trendingTopics: string[]
}

export interface PerformanceInsight {
  type: 'engagement' | 'timing' | 'content' | 'hashtag'
  title: string
  description: string
  recommendation: string
  confidence: number
  metrics: Record<string, string | number | [string, number][]>
}

interface DatabasePerformanceData {
  content_id: string
  engagement_rate: number
  performance_score: number
  likes_count?: number
  retweets_count?: number
  replies_count?: number
  impressions?: number
  tracked_at: string
  ai_superconnector_content?: {
    content_type: string
    hashtags: string[]
    scheduled_at: string
  }
}

interface DatabaseContentData {
  hashtags: string[]
  created_at: string
}

export class ContentAnalyticsService {
  private supabase = createClient()

  /**
   * Track content performance metrics
   */
  async trackContentPerformance(
    contentId: string,
    metrics: Partial<ContentPerformanceMetrics>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('content_performance')
        .upsert({
          content_id: contentId,
          likes_count: metrics.likesCount || 0,
          retweets_count: metrics.retweetsCount || 0,
          replies_count: metrics.repliesCount || 0,
          impressions: metrics.impressions || 0,
          engagement_rate: this.calculateEngagementRate(metrics),
          performance_score: this.calculatePerformanceScore(metrics),
          tracked_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      await systemLogger.info('ContentAnalyticsService', 'Content performance tracked', {
        contentId,
        metrics
      })
      
    } catch (error) {
      await systemLogger.error('ContentAnalyticsService', 'Failed to track content performance', { error, contentId, metrics })
      throw error
    }
  }

  /**
   * Get content analytics for a user
   */
  async getUserContentAnalytics(
    userId: string,
    days: number = 30
  ): Promise<ContentAnalytics> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get content performance data
      const { data: performanceData, error: performanceError } = await this.supabase
        .from('content_performance')
        .select(`
          *,
          ai_superconnector_content (
            id,
            content_type,
            hashtags,
            scheduled_at,
            user_id
          )
        `)
        .gte('tracked_at', startDate.toISOString())
        .eq('ai_superconnector_content.user_id', userId)

      if (performanceError) {
        throw performanceError
      }

      // Get content data
      const { data: contentData, error: contentError } = await this.supabase
        .from('ai_superconnector_content')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())

      if (contentError) {
        throw contentError
      }

      return this.calculateAnalytics(performanceData, contentData)
      
    } catch (error) {
      await systemLogger.error('ContentAnalyticsService', 'Failed to get user content analytics', { error, userId })
      throw error
    }
  }

  /**
   * Get performance insights and recommendations
   */
  async getPerformanceInsights(userId: string): Promise<PerformanceInsight[]> {
    try {
      const analytics = await this.getUserContentAnalytics(userId, 30)
      const insights: PerformanceInsight[] = []

      // Engagement insights
      if (analytics.averageEngagementRate < 0.03) {
        insights.push({
          type: 'engagement',
          title: 'Low Engagement Rate',
          description: `Your average engagement rate is ${(analytics.averageEngagementRate * 100).toFixed(2)}%, below the 3% target.`,
          recommendation: 'Focus on creating more engaging content with questions and calls-to-action. Consider testing different content types.',
          confidence: 0.85,
          metrics: { currentRate: analytics.averageEngagementRate, targetRate: 0.03 }
        })
      }

      // Content type insights
      const contentTypeInsights = this.analyzeContentTypePerformance(analytics.contentTypePerformance)
      insights.push(...contentTypeInsights)

      // Timing insights
      const timingInsights = this.analyzeTimingPerformance(analytics.timeSlotPerformance)
      insights.push(...timingInsights)

      // Hashtag insights
      const hashtagInsights = this.analyzeHashtagPerformance(analytics.hashtagPerformance)
      insights.push(...hashtagInsights)

      return insights
      
    } catch (error) {
      await systemLogger.error('ContentAnalyticsService', 'Failed to get performance insights', { error, userId })
      throw error
    }
  }

  /**
   * Get trending topics and hashtags
   */
  async getTrendingTopics(days: number = 7): Promise<string[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from('ai_superconnector_content')
        .select('hashtags')
        .gte('created_at', startDate.toISOString())
        .not('hashtags', 'eq', '{}')

      if (error) {
        throw error
      }

      const hashtagCounts: Record<string, number> = {}
      
      data.forEach(item => {
        item.hashtags.forEach((hashtag: string) => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1
        })
      })

      // Sort by frequency and return top trending
      return Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([hashtag]) => hashtag)
      
    } catch (error) {
      await systemLogger.error('ContentAnalyticsService', 'Failed to get trending topics', { error })
      return []
    }
  }

  /**
   * Calculate analytics from raw data
   */
  private calculateAnalytics(performanceData: DatabasePerformanceData[], contentData: DatabaseContentData[]): ContentAnalytics {
    const analytics: ContentAnalytics = {
      totalContent: contentData.length,
      averageEngagementRate: 0,
      topPerformingContent: [],
      contentTypePerformance: {},
      hashtagPerformance: {},
      timeSlotPerformance: {},
      trendingTopics: []
    }

    // Calculate engagement rates and performance scores
    const engagementRates: number[] = []
    const performanceScores: number[] = []

    performanceData.forEach(item => {
      const engagementRate = item.engagement_rate || 0
      const performanceScore = item.performance_score || 0
      
      engagementRates.push(engagementRate)
      performanceScores.push(performanceScore)

      // Track content type performance
      const contentType = item.ai_superconnector_content?.content_type
      if (contentType) {
        analytics.contentTypePerformance[contentType] = 
          (analytics.contentTypePerformance[contentType] || 0) + engagementRate
      }

      // Track hashtag performance
      const hashtags = item.ai_superconnector_content?.hashtags || []
      hashtags.forEach((hashtag: string) => {
        analytics.hashtagPerformance[hashtag] = 
          (analytics.hashtagPerformance[hashtag] || 0) + engagementRate
      })

      // Track time slot performance
      const scheduledAt = item.ai_superconnector_content?.scheduled_at
      if (scheduledAt) {
        const hour = new Date(scheduledAt).getHours()
        const timeSlot = this.getTimeSlot(hour)
        analytics.timeSlotPerformance[timeSlot] = 
          (analytics.timeSlotPerformance[timeSlot] || 0) + engagementRate
      }
    })

    // Calculate averages
    if (engagementRates.length > 0) {
      analytics.averageEngagementRate = engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
    }

    // Get top performing content
    analytics.topPerformingContent = performanceData
      .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
      .slice(0, 5)
      .map(item => this.mapPerformanceMetrics(item))

    // Get trending topics
    analytics.trendingTopics = this.extractTrendingTopics(contentData)

    return analytics
  }

  /**
   * Calculate engagement rate from metrics
   */
  private calculateEngagementRate(metrics: Partial<ContentPerformanceMetrics>): number {
    const { likesCount = 0, retweetsCount = 0, repliesCount = 0, impressions = 0 } = metrics
    
    if (impressions === 0) return 0
    
    const engagement = likesCount + retweetsCount + repliesCount
    return engagement / impressions
  }

  /**
   * Calculate performance score from metrics
   */
  private calculatePerformanceScore(metrics: Partial<ContentPerformanceMetrics>): number {
    const { likesCount = 0, retweetsCount = 0, repliesCount = 0, impressions = 0 } = metrics
    
    if (impressions === 0) return 0
    
    // Weight different engagement types
    const engagementScore = (likesCount * 1) + (retweetsCount * 2) + (repliesCount * 3)
    const baseScore = engagementScore / impressions
    
    // Normalize to 0-1 scale
    return Math.min(1, Math.max(0, baseScore * 100))
  }

  /**
   * Get time slot from hour
   */
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 9) return '6:00 AM - 9:00 AM'
    if (hour >= 9 && hour < 12) return '9:00 AM - 12:00 PM'
    if (hour >= 12 && hour < 15) return '12:00 PM - 3:00 PM'
    if (hour >= 15 && hour < 18) return '3:00 PM - 6:00 PM'
    if (hour >= 18 && hour < 21) return '6:00 PM - 9:00 PM'
    return '9:00 PM - 6:00 AM'
  }

  /**
   * Extract trending topics from content
   */
  private extractTrendingTopics(contentData: DatabaseContentData[]): string[] {
    const hashtagCounts: Record<string, number> = {}
    
    contentData.forEach(item => {
      const hashtags = item.hashtags || []
      hashtags.forEach((hashtag: string) => {
        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1
      })
    })

    return Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hashtag]) => hashtag)
  }

  /**
   * Analyze content type performance
   */
  private analyzeContentTypePerformance(contentTypePerformance: Record<string, number>): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []
    
    Object.entries(contentTypePerformance).forEach(([contentType, performance]) => {
      if (performance < 0.02) {
        insights.push({
          type: 'content',
          title: `Low Performance: ${contentType}`,
          description: `${contentType} content is underperforming with an average engagement rate of ${(performance * 100).toFixed(2)}%.`,
          recommendation: 'Consider revising your approach to this content type or testing different formats.',
          confidence: 0.75,
          metrics: { contentType, performance }
        })
      }
    })

    return insights
  }

  /**
   * Analyze timing performance
   */
  private analyzeTimingPerformance(timeSlotPerformance: Record<string, number>): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []
    
    const bestTimeSlot = Object.entries(timeSlotPerformance)
      .sort(([, a], [, b]) => b - a)[0]

    if (bestTimeSlot) {
      insights.push({
        type: 'timing',
        title: 'Best Performing Time Slot',
        description: `${bestTimeSlot[0]} is your best performing time slot with an average engagement rate of ${(bestTimeSlot[1] * 100).toFixed(2)}%.`,
        recommendation: 'Focus on posting your most important content during this time slot.',
        confidence: 0.80,
        metrics: { timeSlot: bestTimeSlot[0], performance: bestTimeSlot[1] }
      })
    }

    return insights
  }

  /**
   * Analyze hashtag performance
   */
  private analyzeHashtagPerformance(hashtagPerformance: Record<string, number>): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []
    
    const topHashtags = Object.entries(hashtagPerformance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    if (topHashtags.length > 0) {
      insights.push({
        type: 'hashtag',
        title: 'Top Performing Hashtags',
        description: `Your top performing hashtags are: ${topHashtags.map(([tag]) => tag).join(', ')}.`,
        recommendation: 'Continue using these hashtags and consider expanding on similar themes.',
        confidence: 0.85,
        metrics: { topHashtags }
      })
    }

    return insights
  }

  /**
   * Map database data to ContentPerformanceMetrics interface
   */
  private mapPerformanceMetrics(data: DatabasePerformanceData): ContentPerformanceMetrics {
    return {
      contentId: data.content_id,
      likesCount: data.likes_count || 0,
      retweetsCount: data.retweets_count || 0,
      repliesCount: data.replies_count || 0,
      impressions: data.impressions || 0,
      engagementRate: data.engagement_rate || 0,
      performanceScore: data.performance_score || 0,
      trackedAt: new Date(data.tracked_at)
    }
  }
}
