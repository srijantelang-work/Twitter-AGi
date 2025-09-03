import Groq from 'groq-sdk'
import { getGroqConfig, getAgentConfig, getSuperconnectorConfig } from '@/lib/config/ai-config'
import { systemLogger } from '@/lib/logging/system-logger'
import { TweetData } from '@/lib/twitter/twitter-api'
import { AI_SUPERCONNECTOR_SYSTEM_PROMPT, SUPERCONNECTOR_CONTENT_PROMPTS } from './prompt-templates'
import { ContentVarietyEngine } from './content-variety-engine'

export interface IntentAnalysis {
  category: string
  confidence: number
  keywords: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  engagementOpportunity: boolean
  priority: 'high' | 'medium' | 'low'
  reasoning: string
}

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

export interface ContentGenerationRequest {
  prompt: string
  context: string
  maxLength?: number
  tone?: string
  includeHashtags?: boolean
  includeEmojis?: boolean
}

export interface SuperconnectorContentRequest {
  contentType: 'networking_tips' | 'ai_insights' | 'startup_humor' | 'community_building' | 'connection_stories' | 'tech_trends'
  context?: string
  includeEngagementPrompt?: boolean
  includeFollowUp?: boolean
}

export class GroqService {
  private groq: Groq
  private config: ReturnType<typeof getGroqConfig>
  private agentConfig: ReturnType<typeof getAgentConfig>
  private superconnectorConfig: ReturnType<typeof getSuperconnectorConfig>
  private contentVarietyEngine: ContentVarietyEngine

  constructor() {
    this.config = getGroqConfig()
    this.agentConfig = getAgentConfig()
    this.superconnectorConfig = getSuperconnectorConfig()
    this.contentVarietyEngine = new ContentVarietyEngine()
    
    this.groq = new Groq({
      apiKey: this.config.apiKey,
    })
  }

  /**
   * Generate AI Superconnector content using Groq
   */
  async generateSuperconnectorContent(request: SuperconnectorContentRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildSuperconnectorContentPrompt(request)
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: AI_SUPERCONNECTOR_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: 0.8, // Slightly higher for creative content
        top_p: 0.9,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from Groq API')
      }

      return await this.parseAIResponse(response, {
        category: 'superconnector_content',
        confidence: 0.85,
        keywords: [],
        sentiment: 'positive',
        engagementOpportunity: true,
        priority: 'medium',
        reasoning: 'AI Superconnector content generation'
      })
      
    } catch (error) {
      await systemLogger.error('Groq Service', 'AI Superconnector content generation failed', { error, request })
      throw error
    }
  }

  /**
   * Generate varied content using the content variety engine
   */
  async generateVariedSuperconnectorContent(): Promise<AIResponse> {
    try {
      // Use the content variety engine to generate diverse content
      const variedContent = await this.contentVarietyEngine.generateVariedContent()
      
      // Convert to AIResponse format
      return {
        content: variedContent.content,
        confidence: variedContent.confidence || 0.9,
        intent: variedContent.contentType || 'varied_content',
        tone: this.superconnectorConfig.personality.tone,
        hashtags: variedContent.hashtags || [],
        emojis: variedContent.emojis || [],
        length: variedContent.content.length,
        isAppropriate: true,
        reasoning: variedContent.reasoning || 'Varied content generation'
      }
    } catch (error) {
      await systemLogger.error('Groq Service', 'Varied content generation failed', { error })
      throw error
    }
  }

  /**
   * Generate content with specific theme
   */
  async generateThemedContent(theme: string, context?: string): Promise<AIResponse> {
    try {
      const prompt = `Generate ${theme} content for the AI Superconnector brand. 
      
Context: ${context || 'General professional networking and AI insights'}
Theme: ${theme}

Requirements:
- Maximum 280 characters
- Include relevant hashtags (2-3 max)
- Use appropriate emojis sparingly
- Encourage engagement and conversation
- Provide genuine value to the audience
- Be original and creative
- Match the AI Superconnector brand voice

Respond with valid JSON containing:
{
  "content": "Your tweet content here",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "emojis": ["🚀", "💡"],
  "engagementPrompt": "Optional question to encourage replies",
  "confidence": 0.95,
  "reasoning": "Why this content works"
}`

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: AI_SUPERCONNECTOR_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: 0.7,
        top_p: 0.9,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from Groq API')
      }

      return await this.parseAIResponse(response, {
        category: 'themed_content',
        confidence: 0.8,
        keywords: [theme],
        sentiment: 'positive',
        engagementOpportunity: true,
        priority: 'medium',
        reasoning: `Themed content generation: ${theme}`
      })
      
    } catch (error) {
      await systemLogger.error('Groq Service', 'Themed content generation failed', { error, theme })
      throw error
    }
  }

  /**
   * Build prompt for AI Superconnector content generation
   */
  private buildSuperconnectorContentPrompt(request: SuperconnectorContentRequest): string {
    const { contentType, context, includeEngagementPrompt, includeFollowUp } = request
    
    let prompt = `Generate ${contentType} content for the AI Superconnector brand.`
    
    if (context) {
      prompt += `\n\nContext: ${context}`
    }
    
    prompt += `\n\nContent Type: ${contentType}`
    prompt += `\nContent Prompt: ${SUPERCONNECTOR_CONTENT_PROMPTS[contentType.toUpperCase() as keyof typeof SUPERCONNECTOR_CONTENT_PROMPTS] || 'Generate engaging content'}`
    
    prompt += `\n\nRequirements:`
    prompt += `\n- Maximum 280 characters`
    prompt += `\n- Include relevant hashtags (2-3 max)`
    prompt += `\n- Use appropriate emojis sparingly`
    prompt += `\n- Encourage engagement and conversation`
    prompt += `\n- Provide genuine value to the audience`
    prompt += `\n- Be original and creative`
    prompt += `\n- Match the AI Superconnector brand voice`
    
    if (includeEngagementPrompt) {
      prompt += `\n- Include an engagement prompt to encourage replies`
    }
    
    if (includeFollowUp) {
      prompt += `\n- Suggest follow-up content for engagement`
    }
    
    prompt += `\n\nRespond with valid JSON containing:`
    prompt += `\n{`
    prompt += `\n  "content": "Your tweet content here",`
    prompt += `\n  "hashtags": ["#hashtag1", "#hashtag2"],`
    prompt += `\n  "emojis": ["🚀", "💡"],`
    prompt += `\n  "engagementPrompt": "Optional question to encourage replies",`
    prompt += `\n  "followUpContent": "Optional follow-up content suggestion",`
    prompt += `\n  "confidence": 0.95,`
    prompt += `\n  "reasoning": "Why this content works"`
    prompt += `\n}`
    
    return prompt
  }

  /**
   * Analyze tweet intent and sentiment
   */
  async analyzeIntent(tweet: TweetData): Promise<IntentAnalysis> {
    try {
      const prompt = this.buildIntentAnalysisPrompt(tweet)
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an AI expert in social media analysis. Analyze the following tweet for intent, sentiment, and engagement opportunities. Respond with a JSON object containing: category, confidence (0-1), keywords (array), sentiment (positive/negative/neutral), engagementOpportunity (boolean), priority (high/medium/low), reasoning (string).`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from Groq API')
      }

      // Parse JSON response
      const analysis = JSON.parse(response) as IntentAnalysis
      
      // Validate and normalize the response
      return this.normalizeIntentAnalysis(analysis)
      
    } catch (error) {
      await systemLogger.error('Groq Service', 'Intent analysis failed', { error, tweetId: tweet.id })
      return this.getDefaultIntentAnalysis(tweet)
    }
  }

  /**
   * Generate AI-powered response to a tweet
   */
  async generateResponse(
    tweet: TweetData,
    intent: IntentAnalysis,
    context?: string
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildResponsePrompt(tweet, intent, context)
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are ${this.agentConfig.personality.name}, an expert in ${this.agentConfig.personality.expertise}. Generate engaging, contextual, and appropriate responses to tweets.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from Groq API')
      }

      return await this.parseAIResponse(response, intent)
      
    } catch (error) {
      await systemLogger.error('Groq Service', 'Response generation failed', { error, tweetId: tweet.id })
      return this.getDefaultResponse(intent)
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
      const prompt = this.buildAutonomousContentPrompt(topic, context, contentType)
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are ${this.agentConfig.personality.name}, an expert in ${this.agentConfig.personality.expertise}. Generate engaging, original content that encourages community interaction and provides value.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from Groq API')
      }

      return await this.parseAIResponse(response, {
        category: 'autonomous_content',
        confidence: 0.8,
        keywords: [],
        sentiment: 'positive',
        engagementOpportunity: true,
        priority: 'medium',
        reasoning: 'Autonomous content generation'
      })
      
    } catch (error) {
      await systemLogger.error('Groq Service', 'Autonomous content generation failed', { error, topic })
      throw error
    }
  }

  /**
   * Generate reply suggestions for a tweet
   */
  async generateReplySuggestions(prompt: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that generates Twitter reply suggestions. Respond with exactly 3 reply suggestions in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from Groq API')
      }

      return response
      
    } catch (error) {
      await systemLogger.error('Groq Service', 'Reply suggestions generation failed', { error })
      throw error
    }
  }

  /**
   * Build prompt for intent analysis
   */
  private buildIntentAnalysisPrompt(tweet: TweetData): string {
    const metrics = tweet.public_metrics || {
      retweet_count: 0,
      reply_count: 0,
      like_count: 0,
      quote_count: 0
    }
    const engagement = metrics.like_count + metrics.retweet_count + metrics.reply_count
    
    return `Analyze this tweet for intent and engagement opportunities:

Tweet: "${tweet.text}"
Author: @${tweet.author_username}
Language: ${tweet.lang || 'unknown'}
Engagement: ${engagement} (likes: ${metrics.like_count}, retweets: ${metrics.retweet_count}, replies: ${metrics.reply_count})
Created: ${tweet.created_at}

Available categories: ${this.agentConfig.intent.categories.join(', ')}

Consider:
- What is the user's intent?
- Is this an opportunity for community engagement?
- What's the sentiment?
- How should we prioritize responding?

Respond with valid JSON only.`
  }

  /**
   * Build prompt for response generation
   */
  private buildResponseGenerationPrompt(
    tweet: TweetData,
    intent: IntentAnalysis,
    context?: string
  ): string {
    const templates = this.agentConfig.engagement.responseTemplates
    const relevantTemplates = templates[intent.category as keyof typeof templates] || templates.community_building
    
    return `Generate a response to this tweet:

Original Tweet: "${tweet.text}"
Author: @${tweet.author_username}
Intent: ${intent.category} (confidence: ${intent.confidence})
Sentiment: ${intent.sentiment}
Priority: ${intent.priority}
Context: ${context || 'Community engagement'}

Available response templates:
${relevantTemplates.map(t => `- ${t}`).join('\n')}

Requirements:
- Keep under ${this.agentConfig.response.maxLength} characters
- Use ${this.agentConfig.personality.tone} tone
- Include ${this.agentConfig.personality.emojiUsage} emojis
- Use ${this.agentConfig.personality.hashtagUsage} hashtags
- Make it feel human and engaging
- Replace {custom_response} with your generated content

Respond with valid JSON containing: content, confidence, intent, tone, hashtags (array), emojis (array), length, reasoning.`
  }

  /**
   * Build prompt for response generation (alias for buildResponseGenerationPrompt)
   */
  private buildResponsePrompt(
    tweet: TweetData,
    intent: IntentAnalysis,
    context?: string
  ): string {
    return this.buildResponseGenerationPrompt(tweet, intent, context)
  }

  /**
   * Build prompt for autonomous content generation
   */
  private buildAutonomousContentPrompt(
    topic: string,
    context: string,
    contentType: 'tweet' | 'thread' | 'question'
  ): string {
    return `Generate ${contentType} content about: ${topic}

Context: ${context}
Style: ${this.agentConfig.personality.style}
Tone: ${this.agentConfig.personality.tone}
Expertise: ${this.agentConfig.personality.expertise}

Requirements:
- Keep under ${this.agentConfig.response.maxLength} characters
- Encourage community interaction
- Provide value to the audience
- Use appropriate hashtags and emojis
- Make it engaging and shareable

Respond with valid JSON containing: content, confidence, intent, tone, hashtags (array), emojis (array), length, reasoning.`
  }

  /**
   * Parse AI response from Groq
   */
  private async parseAIResponse(response: string, intent: IntentAnalysis): Promise<AIResponse> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          content: parsed.content || 'Thank you for your message!',
          confidence: parsed.confidence || 0.7,
          intent: parsed.intent || intent.category,
          tone: parsed.tone || this.agentConfig.personality.tone,
          hashtags: parsed.hashtags || [],
          emojis: parsed.emojis || [],
          length: parsed.length || (parsed.content?.length || 0),
          isAppropriate: true,
          reasoning: parsed.reasoning || 'AI-generated response'
        }
      }
      
      // Fallback to parsing the entire response
      return {
        content: response.trim(),
        confidence: 0.6,
        intent: intent.category,
        tone: this.agentConfig.personality.tone,
        hashtags: [],
        emojis: [],
        length: response.length,
        isAppropriate: true,
        reasoning: 'Parsed from AI response'
      }
      
    } catch (error) {
      await systemLogger.warn('Groq Service', 'Failed to parse AI response as JSON', { response, error })
      
      // Return a safe fallback response
      return {
        content: response.trim() || 'Thank you for your message!',
        confidence: 0.5,
        intent: intent.category,
        tone: this.agentConfig.personality.tone,
        hashtags: [],
        emojis: [],
        length: response.length || 0,
        isAppropriate: true,
        reasoning: 'Fallback response parsing'
      }
    }
  }

  /**
   * Validate response appropriateness
   */
  private async validateResponseAppropriateness(content: string, tweet: TweetData): Promise<boolean> {
    try {
      const prompt = `Validate if this response is appropriate for social media:

Original Tweet: "${tweet.text}"
Proposed Response: "${content}"

Check for:
- Inappropriate content
- Spam-like behavior
- Offensive language
- Misinformation
- Over-promotion

Respond with JSON: {"appropriate": boolean, "reasoning": string}`

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a content safety validator. Assess if content is appropriate for social media.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.config.model,
        max_tokens: 100,
        temperature: 0.1,
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        const validation = JSON.parse(response)
        return validation.appropriate !== false
      }
      
      return true // Default to safe if validation fails
      
    } catch (error) {
      await systemLogger.warn('Groq Service', 'Response validation failed', { error })
      return true // Default to safe if validation fails
    }
  }

  /**
   * Normalize intent analysis response
   */
  private normalizeIntentAnalysis(analysis: IntentAnalysis): IntentAnalysis {
    return {
      category: analysis.category || 'community_building',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
      sentiment: ['positive', 'negative', 'neutral'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
      engagementOpportunity: Boolean(analysis.engagementOpportunity),
      priority: ['high', 'medium', 'low'].includes(analysis.priority) ? analysis.priority : 'medium',
      reasoning: analysis.reasoning || 'AI analysis'
    }
  }

  /**
   * Get default intent analysis when AI fails
   */
  private getDefaultIntentAnalysis(tweet: TweetData): IntentAnalysis {
    const text = tweet.text.toLowerCase()
    const hasQuestion = text.includes('?') || text.includes('help') || text.includes('support')
    const hasPositive = text.includes('great') || text.includes('awesome') || text.includes('love')
    const hasNegative = text.includes('bad') || text.includes('terrible') || text.includes('hate')
    
    return {
      category: hasQuestion ? 'customer_support' : 'community_building',
      confidence: 0.5,
      keywords: text.split(' ').filter(word => word.length > 3).slice(0, 5),
      sentiment: hasPositive ? 'positive' : hasNegative ? 'negative' : 'neutral',
      engagementOpportunity: hasQuestion || hasPositive,
      priority: hasQuestion ? 'high' : 'medium',
      reasoning: 'Default analysis due to AI failure'
    }
  }

  /**
   * Get default response when AI fails
   */
  private getDefaultResponse(intent: IntentAnalysis): AIResponse {
    const templates = this.agentConfig.engagement.responseTemplates
    const relevantTemplates = templates[intent.category as keyof typeof templates] || templates.community_building
    const template = relevantTemplates[Math.floor(Math.random() * relevantTemplates.length)]
    
    return {
      content: template.replace('{custom_response}', 'We appreciate your engagement!'),
      confidence: 0.5,
      intent: intent.category,
      tone: this.agentConfig.personality.tone,
      hashtags: ['#Community', '#Engagement'],
      emojis: ['🙏'],
      length: template.length,
      isAppropriate: true,
      reasoning: 'Default response due to AI failure'
    }
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Hello' }],
        model: this.config.model,
        max_tokens: 10,
        temperature: 0,
      })
      
      return completion.choices[0]?.message?.content !== undefined
    } catch (error) {
      await systemLogger.error('Groq Service', 'Health check failed', { error })
      return false
    }
  }
}
