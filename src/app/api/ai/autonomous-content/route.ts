import { NextRequest, NextResponse } from 'next/server'
import { AIAgent } from '@/lib/ai/ai-agent'
import { systemLogger } from '@/lib/logging/system-logger'
import { getGroqConfig } from '@/lib/config/ai-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, context, contentType, schedule } = body

    if (!topic || !context || !contentType) {
      return NextResponse.json(
        { error: 'Topic, context, and contentType are required' },
        { status: 400 }
      )
    }

    if (!['tweet', 'thread', 'question'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid contentType. Use: tweet, thread, or question' },
        { status: 400 }
      )
    }

    // Check if Groq API is configured
    try {
      getGroqConfig()
    } catch {
      return NextResponse.json(
        { error: 'Groq API not configured. Please set GROQ_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Mock Twitter credentials for now (in production, get from authenticated user)
    const mockCredentials = {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: '',
      accessTokenSecret: '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    }
    
    const aiAgent = new AIAgent(mockCredentials)

    // Generate autonomous content
    const content = await aiAgent.generateAutonomousContent(topic, context, contentType)

    // If scheduling is requested, handle it here
    let scheduledAt: string | undefined
    if (schedule && schedule.scheduledAt) {
      scheduledAt = new Date(schedule.scheduledAt).toISOString()
      
      // In a real implementation, you would save this to a scheduling system
      await systemLogger.info('AI API', 'Content scheduled for later', {
        topic,
        contentType,
        scheduledAt
      })
    }

    await systemLogger.info('AI API', 'Autonomous content generated successfully', {
      topic,
      contentType,
      confidence: content.confidence,
      length: content.length
    })

    return NextResponse.json({
      success: true,
      data: {
        content,
        scheduledAt,
        metadata: {
          topic,
          context,
          contentType,
          generatedAt: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('AI API', 'Autonomous content generation failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate autonomous content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get autonomous content suggestions
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic parameter is required' },
        { status: 400 }
      )
    }

    // Mock Twitter credentials for now
    const mockCredentials = {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: '',
      accessTokenSecret: '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    }
    
    const aiAgent = new AIAgent(mockCredentials)

    // Generate multiple content suggestions
    const suggestions = []
    const contentTypes: Array<'tweet' | 'thread' | 'question'> = ['tweet', 'thread', 'question']
    
    for (let i = 0; i < Math.min(limit, contentTypes.length); i++) {
      try {
        const contentType = contentTypes[i]
        const context = `Content suggestion ${i + 1} for ${topic}`
        
        const content = await aiAgent.generateAutonomousContent(topic, context, contentType)
        suggestions.push({
          contentType,
          content,
          suggestionId: i + 1
        })
      } catch (error) {
        await systemLogger.warn('AI API', 'Failed to generate suggestion', { error, suggestionIndex: i })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        topic,
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
