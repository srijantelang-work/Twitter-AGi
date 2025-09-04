/**
 * Content Variety Engine
 * 
 * Manages content rotation, variety, and optimization to ensure
 * diverse and engaging content for the AI Superconnector brand.
 */

import { getSuperconnectorConfig } from '@/lib/config/ai-config'
import { systemLogger } from '@/lib/logging/system-logger'
import { NetworkingContentGenerator } from './content-generators/networking-content'
import { AIInsightsContentGenerator } from './content-generators/ai-insights'
import { StartupHumorContentGenerator } from './content-generators/startup-humor'

import { NetworkingContentPiece } from './content-generators/networking-content'
import { AIInsightContentPiece } from './content-generators/ai-insights'
import { StartupHumorContentPiece } from './content-generators/startup-humor'

export interface ContentVarietyConfig {
  maxConsecutiveSimilarContent: number
  contentTypeWeights: Record<string, number>
  hashtagVariety: boolean
  emojiVariety: boolean
  engagementPatternVariety: boolean
}

export interface ContentVarietyMetrics {
  contentTypeDistribution: Record<string, number>
  hashtagUsage: Record<string, number>
  emojiUsage: Record<string, number>
  engagementPatterns: Record<string, number>
  lastContentTypes: string[]
}

export interface CommunityBuildingContentPiece {
  content: string
  hashtags: string[]
  emojis: string[]
  engagementPrompt: string
  contentType: 'community_building'
  confidence: number
  reasoning: string
}

export class ContentVarietyEngine {
  private config = getSuperconnectorConfig()
  private networkingGenerator = new NetworkingContentGenerator()
  private aiInsightsGenerator = new AIInsightsContentGenerator()
  private startupHumorGenerator = new StartupHumorContentGenerator()
  
  private varietyConfig: ContentVarietyConfig = {
    maxConsecutiveSimilarContent: 2,
    contentTypeWeights: {
      networking_tips: 0.3,
      ai_insights: 0.25,
      startup_humor: 0.25,
      community_building: 0.2
    },
    hashtagVariety: true,
    emojiVariety: true,
    engagementPatternVariety: true
  }

  private metrics: ContentVarietyMetrics = {
    contentTypeDistribution: {},
    hashtagUsage: {},
    emojiUsage: {},
    engagementPatterns: {},
    lastContentTypes: []
  }

  /**
   * Generate content with variety optimization
   */
  async generateVariedContent(): Promise<NetworkingContentPiece | AIInsightContentPiece | StartupHumorContentPiece | CommunityBuildingContentPiece> {
    try {
      // Analyze recent content to determine optimal next content type
      const optimalContentType = this.determineOptimalContentType()
      
      // Generate content based on the optimal type
      const content = await this.generateContentByType(optimalContentType)
      
      // Update metrics
      this.updateMetrics(content)
      
      // Validate content variety
      await this.validateContentVariety(content)
      
      return content
    } catch (error) {
      await systemLogger.error('ContentVarietyEngine', 'Failed to generate varied content', { error })
      throw error
    }
  }

  /**
   * Determine the optimal content type based on variety metrics
   */
  private determineOptimalContentType(): string {
    const recentTypes = this.metrics.lastContentTypes.slice(-3)
    const typeCounts = this.getContentTypeCounts()
    
    // Calculate variety scores for each content type
    const varietyScores = Object.keys(this.varietyConfig.contentTypeWeights).map(type => ({
      type,
      score: this.calculateVarietyScore(type, recentTypes, typeCounts)
    }))
    
    // Sort by variety score and return the best option
    varietyScores.sort((a, b) => b.score - a.score)
    return varietyScores[0].type
  }

  /**
   * Calculate variety score for a content type
   */
  private calculateVarietyScore(
    contentType: string, 
    recentTypes: string[], 
    typeCounts: Record<string, number>
  ): number {
    let score = 0
    
    // Base weight from config
    score += this.varietyConfig.contentTypeWeights[contentType] || 0
    
    // Penalty for recent usage
    const recentUsage = recentTypes.filter(type => type === contentType).length
    score -= recentUsage * 0.3
    
    // Bonus for underrepresented types
    const totalContent = Object.values(typeCounts).reduce((sum, count) => sum + count, 0)
    const currentPercentage = totalContent > 0 ? (typeCounts[contentType] || 0) / totalContent : 0
    const targetPercentage = this.varietyConfig.contentTypeWeights[contentType] || 0
    
    if (currentPercentage < targetPercentage) {
      score += 0.2
    }
    
    return Math.max(0, score)
  }

  /**
   * Generate content by specific type
   */
  private async generateContentByType(contentType: string): Promise<NetworkingContentPiece | AIInsightContentPiece | StartupHumorContentPiece | CommunityBuildingContentPiece> {
    switch (contentType) {
      case 'networking_tips':
        return await this.networkingGenerator.generateRandomNetworkingContent()
      
      case 'ai_insights':
        return await this.aiInsightsGenerator.generateRandomAIInsight()
      
      case 'startup_humor':
        return await this.startupHumorGenerator.generateRandomStartupHumor()
      
      case 'community_building':
        return await this.generateCommunityBuildingContent()
      
      default:
        // Fallback to networking content
        return await this.networkingGenerator.generateRandomNetworkingContent()
    }
  }

  /**
   * Generate community building content
   */
  private async generateCommunityBuildingContent(): Promise<CommunityBuildingContentPiece> {
    const communityContent = [
      {
        content: "Communities don't build themselves. The secret? Start with 5 passionate people, give them ownership, and watch it grow organically.",
        hashtags: ["#CommunityBuilding", "#Ownership", "#OrganicGrowth"],
        emojis: ["👥", "🌱"],
        engagementPrompt: "What's your community building secret?",
        contentType: 'community_building' as const,
        confidence: 0.92,
        reasoning: "Provides actionable community building strategy"
      },
      {
        content: "The best communities are built on shared values, not shared interests. Values create bonds, interests create conversations.",
        hashtags: ["#CommunityValues", "#SharedValues", "#CommunityBonds"],
        emojis: ["💎", "🔗"],
        engagementPrompt: "What values drive your community?",
        contentType: 'community_building' as const,
        confidence: 0.90,
        reasoning: "Distinguishes between values and interests in community building"
      },
      {
        content: "Community engagement hack: Ask questions that make people think, not just answer. 'What if...' beats 'What do you think...' every time.",
        hashtags: ["#CommunityEngagement", "#EngagementHacks", "#BetterQuestions"],
        emojis: ["💡", "❓"],
        engagementPrompt: "What's your best engagement question?",
        contentType: 'community_building' as const,
        confidence: 0.88,
        reasoning: "Provides specific engagement strategy with examples"
      }
    ]

    const content = communityContent[Math.floor(Math.random() * communityContent.length)]
    return content
  }

  /**
   * Get content type distribution counts
   */
  private getContentTypeCounts(): Record<string, number> {
    return this.metrics.contentTypeDistribution
  }

  /**
   * Update metrics with new content
   */
  private updateMetrics(content: NetworkingContentPiece | AIInsightContentPiece | StartupHumorContentPiece | CommunityBuildingContentPiece): void {
    const contentType = content.contentType || 'unknown'
    
    // Update content type distribution
    this.metrics.contentTypeDistribution[contentType] = 
      (this.metrics.contentTypeDistribution[contentType] || 0) + 1
    
    // Update hashtag usage
    if (content.hashtags) {
      content.hashtags.forEach((hashtag: string) => {
        this.metrics.hashtagUsage[hashtag] = (this.metrics.hashtagUsage[hashtag] || 0) + 1
      })
    }
    
    // Update emoji usage
    if (content.emojis) {
      content.emojis.forEach((emoji: string) => {
        this.metrics.emojiUsage[emoji] = (this.metrics.emojiUsage[emoji] || 0) + 1
      })
    }
    
    // Update engagement patterns
    if (content.engagementPrompt) {
      const pattern = this.categorizeEngagementPattern(content.engagementPrompt)
      this.metrics.engagementPatterns[pattern] = (this.metrics.engagementPatterns[pattern] || 0) + 1
    }
    
    // Update recent content types
    this.metrics.lastContentTypes.push(contentType)
    if (this.metrics.lastContentTypes.length > 10) {
      this.metrics.lastContentTypes.shift()
    }
  }

  /**
   * Categorize engagement pattern
   */
  private categorizeEngagementPattern(prompt: string): string {
    if (prompt.includes('?')) return 'question'
    if (prompt.includes('story')) return 'story_request'
    if (prompt.includes('tip') || prompt.includes('advice')) return 'advice_request'
    if (prompt.includes('experience')) return 'experience_share'
    return 'general_engagement'
  }

  /**
   * Validate content variety
   */
  private async validateContentVariety(content: NetworkingContentPiece | AIInsightContentPiece | StartupHumorContentPiece | CommunityBuildingContentPiece): Promise<void> {
    const recentTypes = this.metrics.lastContentTypes.slice(-this.varietyConfig.maxConsecutiveSimilarContent)
    const contentType = content.contentType || 'unknown'
    
    // Check for consecutive similar content
    const consecutiveCount = recentTypes.filter(type => type === contentType).length
    if (consecutiveCount >= this.varietyConfig.maxConsecutiveSimilarContent) {
      await systemLogger.warn('ContentVarietyEngine', 'Too many consecutive similar content types', {
        contentType,
        consecutiveCount,
        recentTypes
      })
    }
    
    // Check hashtag variety
    if (this.varietyConfig.hashtagVariety && content.hashtags) {
      const duplicateHashtags = this.findDuplicateHashtags(content.hashtags)
      if (duplicateHashtags.length > 0) {
        await systemLogger.warn('ContentVarietyEngine', 'Duplicate hashtags detected', {
          duplicateHashtags,
          contentType: content.contentType
        })
      }
    }
  }

  /**
   * Find duplicate hashtags in recent content
   */
  private findDuplicateHashtags(hashtags: string[]): string[] {
    const recentHashtags = Object.keys(this.metrics.hashtagUsage)
      .filter(hashtag => this.metrics.hashtagUsage[hashtag] > 1)
    
    return hashtags.filter(hashtag => recentHashtags.includes(hashtag))
  }

  /**
   * Get variety metrics
   */
  getVarietyMetrics(): ContentVarietyMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset variety metrics
   */
  resetVarietyMetrics(): void {
    this.metrics = {
      contentTypeDistribution: {},
      hashtagUsage: {},
      emojiUsage: {},
      engagementPatterns: {},
      lastContentTypes: []
    }
  }

  /**
   * Update variety configuration
   */
  updateVarietyConfig(newConfig: Partial<ContentVarietyConfig>): void {
    this.varietyConfig = { ...this.varietyConfig, ...newConfig }
  }
}
