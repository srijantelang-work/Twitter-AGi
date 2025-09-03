import { NextRequest, NextResponse } from 'next/server'
import { ReplyGenerator, ReplyContext, Tone } from '@/lib/ai/reply-generator'
import { systemLogger } from '@/lib/logging/system-logger'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      tweetId,
      tweetContent,
      authorUsername,
      userKeywords = [],
      tone,
      engagementMetrics
    } = body

    // Validate required fields
    if (!tweetId || !tweetContent || !authorUsername || !tone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: tweetId, tweetContent, authorUsername, tone' 
        },
        { status: 400 }
      )
    }

    // Validate tone
    const replyGenerator = new ReplyGenerator()
    if (!replyGenerator.isValidTone(tone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid tone. Must be one of: ${Object.keys(replyGenerator.getAvailableTones()).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Log the request
    await systemLogger.info('Generate Reply API', 'Reply generation request received', {
      tweetId,
      authorUsername,
      tone,
      hasKeywords: userKeywords.length > 0,
      hasEngagement: !!engagementMetrics
    })

    // Build context
    const context: ReplyContext = {
      tweetId,
      tweetContent,
      authorUsername,
      userKeywords,
      engagementMetrics
    }

    // Generate reply suggestions
    const startTime = Date.now()
    const suggestions = await replyGenerator.generateReplySuggestions(context, tone as Tone)
    const processingTime = Date.now() - startTime

    // Log success
    await systemLogger.info('Generate Reply API', 'Reply suggestions generated successfully', {
      tweetId,
      tone,
      suggestionCount: suggestions.length,
      processingTime
    })

    // Return response
    return NextResponse.json({
      success: true,
      suggestions,
      metadata: {
        tone: replyGenerator.getAvailableTones()[tone].name,
        generatedAt: new Date().toISOString(),
        processingTime,
        tweetId,
        authorUsername
      }
    })

  } catch (error) {
    // Log error
    await systemLogger.error('Generate Reply API', 'Failed to generate reply suggestions', {
      error,
      requestBody: await request.text()
    })

    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate reply suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate reply suggestions.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate reply suggestions.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate reply suggestions.' },
    { status: 405 }
  )
}
