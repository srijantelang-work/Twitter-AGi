import { NextResponse } from 'next/server'
import { ReplyGenerator } from '@/lib/ai/reply-generator'

export async function GET() {
  try {
    const replyGenerator = new ReplyGenerator()
    
    // Test with sample data
    const testContext = {
      tweetId: 'test-123',
      tweetContent: 'Looking for recommendations for good coffee shops in San Francisco! ☕',
      authorUsername: 'coffee_lover',
      userKeywords: ['coffee', 'san francisco', 'recommendations'],
      engagementMetrics: {
        likes: 15,
        retweets: 3,
        replies: 8,
        quotes: 1
      }
    }

    const suggestions = await replyGenerator.generateReplySuggestions(testContext, 'HELPFUL')
    
    return NextResponse.json({
      success: true,
      message: 'AI Reply Suggestion System is working!',
      testData: {
        context: testContext,
        suggestions,
        availableTones: replyGenerator.getAvailableTones()
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
