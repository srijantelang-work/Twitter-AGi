import { NextRequest, NextResponse } from 'next/server'
import { GroqService } from '@/lib/ai/groq-service'
import { ContentVarietyEngine } from '@/lib/ai/content-variety-engine'
import { systemLogger } from '@/lib/logging/system-logger'
import { getSuperconnectorConfig } from '@/lib/config/ai-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, context, includeEngagementPrompt, includeFollowUp } = body

    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      )
    }

    // Validate content type
    const validContentTypes = [
      'networking_tips',
      'ai_insights', 
      'startup_humor',
      'community_building',
      'connection_stories',
      'tech_trends'
    ]

    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Use: ${validContentTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if Groq API is configured
    try {
      getSuperconnectorConfig()
    } catch {
      return NextResponse.json(
        { error: 'AI Superconnector configuration not found. Please check your configuration.' },
        { status: 500 }
      )
    }

    const groqService = new GroqService()
    const varietyEngine = new ContentVarietyEngine()

    let content

    // Generate content based on type
    if (contentType === 'varied') {
      // Use variety engine for diverse content
      content = await varietyEngine.generateVariedContent()
    } else {
      // Generate specific content type
      content = await groqService.generateSuperconnectorContent({
        contentType: contentType as any,
        context: context || `Generate ${contentType} content for the AI Superconnector brand`,
        includeEngagementPrompt: includeEngagementPrompt || false,
        includeFollowUp: includeFollowUp || false
      })
    }

    await systemLogger.info('AI API', 'Content generated successfully', {
      contentType,
      confidence: content.confidence,
      length: content.length
    })

    return NextResponse.json({
      success: true,
      data: {
        content,
        metadata: {
          contentType,
          context,
          generatedAt: new Date().toISOString(),
          varietyEngine: contentType === 'varied'
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('AI API', 'Content generation failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '3')

    if (limit > 10) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 10' },
        { status: 400 }
      )
    }

    const groqService = new GroqService()
    const varietyEngine = new ContentVarietyEngine()

    const suggestions = []

    if (contentType && contentType !== 'varied') {
      // Generate specific content type
      for (let i = 0; i < limit; i++) {
        try {
          const content = await groqService.generateSuperconnectorContent({
            contentType: contentType as any,
            context: `Content suggestion ${i + 1} for ${contentType}`,
            includeEngagementPrompt: true
          })
          
          suggestions.push({
            suggestionId: i + 1,
            contentType,
            content
          })
        } catch (error) {
          await systemLogger.warn('AI API', 'Failed to generate suggestion', { error, suggestionIndex: i })
        }
      }
    } else {
      // Generate varied content
      for (let i = 0; i < limit; i++) {
        try {
          const content = await varietyEngine.generateVariedContent()
          
          suggestions.push({
            suggestionId: i + 1,
            contentType: 'varied',
            content
          })
        } catch (error) {
          await systemLogger.warn('AI API', 'Failed to generate varied suggestion', { error, suggestionIndex: i })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        contentType: contentType || 'varied',
        suggestions,
        total: suggestions.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    await systemLogger.error('AI API', 'Content suggestions failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
