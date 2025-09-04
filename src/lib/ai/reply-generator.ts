/**
 * AI Reply Generator Service
 * 
 * This service orchestrates the AI reply generation process, including
 * context analysis, prompt construction, tone application, and response validation.
 */

import { GroqService } from './groq-service'
import { 
  BASE_SYSTEM_PROMPT, 
  TONE_SPECIFIC_PROMPTS, 
  CHARACTER_LIMIT_REMINDER,
  TONES,
  ToneDefinition
} from './prompt-templates'
import { systemLogger } from '@/lib/logging/system-logger'

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

export interface ReplySuggestion {
  content: string
  characterCount: number
  reasoning: string
  tone: string
  isAppropriate: boolean
}

export type Tone = keyof typeof TONES

export class ReplyGenerator {
  private groqService: GroqService

  constructor() {
    this.groqService = new GroqService()
  }

  /**
   * Generate multiple reply suggestions for a tweet
   */
  async generateReplySuggestions(
    context: ReplyContext,
    tone: Tone
  ): Promise<ReplySuggestion[]> {
    try {
      await systemLogger.info('ReplyGenerator', 'Generating reply suggestions', {
        tweetId: context.tweetId,
        tone,
        authorUsername: context.authorUsername
      })

      // Build the context-aware prompt
      const prompt = this.buildContextPrompt(context, tone)
      
      // Generate replies using Groq
      const response = await this.groqService.generateReplySuggestions(prompt)
      
      // Validate and process the suggestions
      const suggestions = this.processAndValidateSuggestions(response, tone)
      
      await systemLogger.info('ReplyGenerator', 'Successfully generated reply suggestions', {
        tweetId: context.tweetId,
        tone,
        suggestionCount: suggestions.length
      })

      return suggestions

    } catch (error) {
      await systemLogger.error('ReplyGenerator', 'Failed to generate reply suggestions', {
        error,
        tweetId: context.tweetId,
        tone
      })
      
      // Return fallback suggestions
      return this.generateFallbackSuggestions(context, tone)
    }
  }

  /**
   * Build a context-aware prompt for the AI
   */
  private buildContextPrompt(context: ReplyContext, tone: Tone): string {
    const toneDefinition = TONES[tone]
    const engagementText = context.engagementMetrics 
      ? `Likes: ${context.engagementMetrics.likes}, Retweets: ${context.engagementMetrics.retweets}, Replies: ${context.engagementMetrics.replies}, Quotes: ${context.engagementMetrics.quotes}`
      : 'No engagement data available'

    const keywordsText = context.userKeywords.length > 0 
      ? context.userKeywords.join(', ')
      : 'No specific keywords'

    let prompt = BASE_SYSTEM_PROMPT
      .replace('{tweetContent}', context.tweetContent)
      .replace('{authorUsername}', context.authorUsername)
      .replace('{userKeywords}', keywordsText)
      .replace('{engagementMetrics}', engagementText)
      .replace('{tone}', toneDefinition.name)

    // Add tone-specific instructions
    prompt += `\n\nTONE INSTRUCTIONS:\n${TONE_SPECIFIC_PROMPTS[tone as keyof typeof TONE_SPECIFIC_PROMPTS]}`

    // Add character limit reminder
    const tweetLength = context.tweetContent.length
    const availableSpace = 280 - tweetLength
    prompt += CHARACTER_LIMIT_REMINDER
      .replace('{tweetLength}', tweetLength.toString())
      .replace('{availableSpace}', availableSpace.toString())

    return prompt
  }

  /**
   * Process and validate AI-generated suggestions
   */
  private processAndValidateSuggestions(
    rawResponse: string, 
    tone: Tone
  ): ReplySuggestion[] {
    try {
      // Parse the JSON response
      const parsed = JSON.parse(rawResponse)
      
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Invalid response format: expected array')
      }

      // Process each suggestion
      const suggestions: ReplySuggestion[] = parsed.slice(0, 3).map((item, index) => {
        if (!item.content || typeof item.content !== 'string') {
          throw new Error(`Invalid suggestion ${index}: missing or invalid content`)
        }

        const content = this.validateAndTruncate(item.content)
        const characterCount = content.length
        const reasoning = item.reasoning || 'AI-generated response'
        const isAppropriate = this.validateAppropriateness(content)

        return {
          content,
          characterCount,
          reasoning,
          tone: TONES[tone].name,
          isAppropriate
        }
      })

      // Ensure we have exactly 3 suggestions
      while (suggestions.length < 3) {
        suggestions.push(this.generateFallbackSuggestion(tone))
      }

      return suggestions.slice(0, 3)

    } catch (error) {
      systemLogger.error('ReplyGenerator', 'Failed to process AI suggestions', { error })
      return this.generateFallbackSuggestions({} as ReplyContext, tone)
    }
  }

  /**
   * Validate and truncate reply content to 280 characters
   */
  private validateAndTruncate(content: string): string {
    if (content.length <= 280) {
      return content
    }

    // Try to truncate at a word boundary
    const truncated = content.substring(0, 277) + '...'
    
    // If still too long, truncate more aggressively
    if (truncated.length > 280) {
      return content.substring(0, 280)
    }

    return truncated
  }

  /**
   * Validate that the content is appropriate
   */
  private validateAppropriateness(content: string): boolean {
    const inappropriateWords = [
      'hate', 'kill', 'stupid', 'idiot', 'dumb', 'ugly', 'fat', 'lazy'
    ]
    
    const lowerContent = content.toLowerCase()
    return !inappropriateWords.some(word => lowerContent.includes(word))
  }

  /**
   * Generate fallback suggestions when AI fails
   */
  private generateFallbackSuggestions(
    context: ReplyContext, 
    tone: Tone
  ): ReplySuggestion[] {
    const toneDefinition = TONES[tone]
    
    const fallbacks = [
      {
        content: `Thanks for sharing! ${toneDefinition.examples[0]}`,
        characterCount: 0,
        reasoning: 'Generated response',
        tone: toneDefinition.name,
        isAppropriate: true
      },
      {
        content: `Great tweet! ${toneDefinition.examples[1]}`,
        characterCount: 0,
        reasoning: 'Generated response',
        tone: toneDefinition.name,
        isAppropriate: true
      },
      {
        content: `Appreciate you! ${toneDefinition.examples[2]}`,
        characterCount: 0,
        reasoning: 'Generated response',
        tone: toneDefinition.name,
        isAppropriate: true
      }
    ]

    // Calculate character counts
    fallbacks.forEach(fallback => {
      fallback.characterCount = fallback.content.length
    })

    return fallbacks
  }

  /**
   * Generate a single fallback suggestion
   */
  private generateFallbackSuggestion(tone: Tone): ReplySuggestion {
    const toneDefinition = TONES[tone]
    const content = `Thanks for the great content! ${toneDefinition.examples[0]}`
    
    return {
      content,
      characterCount: content.length,
      reasoning: 'Generated response',
      tone: toneDefinition.name,
      isAppropriate: true
    }
  }

  /**
   * Get available tones
   */
  getAvailableTones(): Record<string, ToneDefinition> {
    return TONES
  }

  /**
   * Validate tone selection
   */
  isValidTone(tone: string): tone is Tone {
    return tone in TONES
  }
}
