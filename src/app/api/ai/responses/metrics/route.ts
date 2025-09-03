import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for time range
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d' // Default to 30 days
    
    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get total responses count
    const { count: totalResponses, error: totalError } = await supabase
      .from('agent_responses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    if (totalError) {
      await systemLogger.error('AI Responses Metrics API', 'Failed to get total responses count', { error: totalError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Get responses by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('agent_responses')
      .select('status')
      .gte('created_at', startDate.toISOString())

    if (statusError) {
      await systemLogger.error('AI Responses Metrics API', 'Failed to get status counts', { error: statusError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Calculate status distribution
    const statusDistribution = statusCounts?.reduce((acc: Record<string, number>, response: { status: string }) => {
      acc[response.status] = (acc[response.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get average confidence score
    const { data: confidenceData, error: confidenceError } = await supabase
      .from('agent_responses')
      .select('confidence_score')
      .gte('created_at', startDate.toISOString())
      .not('confidence_score', 'is', null)

    if (confidenceError) {
      await systemLogger.error('AI Responses Metrics API', 'Failed to get confidence scores', { error: confidenceError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    const averageConfidence = confidenceData && confidenceData.length > 0
      ? confidenceData.reduce((sum: number, item: { confidence_score: number | null }) => sum + (item.confidence_score || 0), 0) / confidenceData.length
      : 0

    // Get response rate (responses vs monitored tweets)
    const { count: monitoredTweets, error: monitoredError } = await supabase
      .from('monitored_tweets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    if (monitoredError) {
      await systemLogger.error('AI Responses Metrics API', 'Failed to get monitored tweets count', { error: monitoredError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    const responseRate = monitoredTweets && monitoredTweets > 0 && totalResponses
      ? Math.round((totalResponses / monitoredTweets) * 100)
      : 0

    // Get top performing responses (by engagement if available)
    const { data: topResponses, error: topError } = await supabase
      .from('agent_responses')
      .select(`
        *,
        monitored_tweets (
          engagement_score
        )
      `)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5)

    if (topError) {
      await systemLogger.error('AI Responses Metrics API', 'Failed to get top responses', { error: topError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    const metrics = {
      totalResponses: totalResponses || 0,
      pendingApproval: statusDistribution['draft'] || 0,
      approved: statusDistribution['scheduled'] || 0,
      rejected: statusDistribution['failed'] || 0,
      published: statusDistribution['published'] || 0,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      responseRate,
      statusDistribution,
      topPerformingResponses: topResponses || [],
      timeRange
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    await systemLogger.error('AI Responses Metrics API', 'Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
