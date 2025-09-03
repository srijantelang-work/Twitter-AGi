/**
 * AI-related type definitions for the Twitter Agent system
 */

export interface AIResponse {
  content: string
  confidence: number
  intent: string
  tone: string
  hashtags: string[]
  emojis: string[]
  length: number
  isAppropriate: boolean
  reasoning: string
}

export interface IntentAnalysis {
  category: string
  confidence: number
  keywords: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  engagementOpportunity: boolean
  priority: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface ContentGenerationRequest {
  prompt: string
  context: string
  maxLength?: number
  tone?: string
  includeHashtags?: boolean
  includeEmojis?: boolean
}

export interface ReplyGenerationRequest {
  tweetId: string
  tweetContent: string
  authorUsername: string
  userKeywords: string[]
  tone: string
  engagementMetrics?: {
    likes: number
    retweets: number
    replies: number
    quotes: number
  }
}

export interface ReplyGenerationResponse {
  success: boolean
  suggestions: ReplySuggestion[]
  metadata: {
    tone: string
    generatedAt: string
    processingTime: number
    tweetId: string
    authorUsername: string
  }
}

export interface ReplySuggestion {
  content: string
  characterCount: number
  reasoning: string
  tone: string
  isAppropriate: boolean
}

export interface ReplyContext {
  tweetId: string
  tweetContent: string
  authorUsername: string
  userKeywords: string[]
  engagementMetrics?: {
    likes: number
    retweets: number
    replies: number
    quotes: number
  }
}

export interface ToneDefinition {
  name: string
  description: string
  instructions: string
  examples: string[]
}

export type Tone = 'HELPFUL' | 'WITTY' | 'PLAYFUL' | 'CONFIDENT' | 'THOUGHTFUL'

export interface AIServiceConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  timeout: number
}

export interface AIGenerationError {
  code: string
  message: string
  details?: unknown
  timestamp: string
}

export interface AIGenerationMetrics {
  requestId: string
  processingTime: number
  tokenUsage: number
  model: string
  success: boolean
  error?: AIGenerationError
  timestamp: string
}
