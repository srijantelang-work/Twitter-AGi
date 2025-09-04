import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContentAnalyticsService } from '@/lib/analytics/content-analytics'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const analyticsService = new ContentAnalyticsService()
    const analytics = await analyticsService.getUserContentAnalytics(user.id, days)

    await systemLogger.info('Analytics API', 'Content analytics retrieved', {
      userId: user.id,
      days,
      totalContent: analytics.totalContent
    })

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Analytics API', 'Failed to get content analytics', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to get content analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, metrics } = body

    if (!contentId || !metrics) {
      return NextResponse.json(
        { error: 'Content ID and metrics are required' },
        { status: 400 }
      )
    }

    const analyticsService = new ContentAnalyticsService()
    await analyticsService.trackContentPerformance(contentId, metrics)

    await systemLogger.info('Analytics API', 'Content performance tracked', {
      contentId,
      metrics
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Performance metrics tracked successfully',
        contentId
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Analytics API', 'Failed to track content performance', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to track content performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
