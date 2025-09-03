import { NextRequest, NextResponse } from 'next/server'
import { GroqService } from '@/lib/ai/groq-service'
import { AIAgent } from '@/lib/ai/ai-agent'
import { systemLogger } from '@/lib/logging/system-logger'
import { getGroqConfig } from '@/lib/config/ai-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tweet, context, action } = body

    if (!tweet || !tweet.id || !tweet.text) {
      return NextResponse.json(
        { error: 'Invalid tweet data provided' },
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

    // Initialize AI services
    const groqService = new GroqService()
    
    // Mock Twitter credentials for now (in production, get from authenticated user)
    const mockCredentials = {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: '',
      accessTokenSecret: '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    }
    
    const aiAgent = new AIAgent(mockCredentials)

    let result: unknown

    switch (action) {
      case 'analyze_intent':
        // Analyze tweet intent only
        result = await groqService.analyzeIntent(tweet)
        break
        
      case 'generate_response':
        // Generate AI response
        const intent = await groqService.analyzeIntent(tweet)
        result = await groqService.generateResponse(tweet, intent, context)
        break
        
      case 'process_tweet':
        // Full tweet processing with AI agent
        result = await aiAgent.processTweet(tweet, context)
        break
        
      case 'execute_action':
        // Execute agent action
        if (!body.agentAction) {
          return NextResponse.json(
            { error: 'Agent action required for execute_action' },
            { status: 400 }
          )
        }
        result = await aiAgent.executeAction(body.agentAction)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified. Use: analyze_intent, generate_response, process_tweet, or execute_action' },
          { status: 400 }
        )
    }

    await systemLogger.info('AI API', 'Response generated successfully', {
      action,
      tweetId: tweet.id,
      resultType: typeof result
    })

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('AI API', 'Response generation failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Health check endpoint
    const groqService = new GroqService()
    const isHealthy = await groqService.healthCheck()
    
    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      timestamp: new Date().toISOString(),
      service: 'AI Response Generation API'
    })
    
  } catch (error) {
    await systemLogger.error('AI API', 'Health check failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Health check failed',
        healthy: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
