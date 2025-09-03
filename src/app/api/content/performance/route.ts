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

    // Get total scheduled content count
    const { count: totalScheduled, error: scheduledError } = await supabase
      .from('content_schedule')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .in('status', ['scheduled', 'published'])

    if (scheduledError) {
      await systemLogger.error('Content Performance API', 'Failed to get scheduled content count', { error: scheduledError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Get total published content count
    const { count: totalPublished, error: publishedError } = await supabase
      .from('content_schedule')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .eq('status', 'published')

    if (publishedError) {
      await systemLogger.error('Content Performance API', 'Failed to get published content count', { error: publishedError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Get content by status for distribution
    const { data: statusCounts, error: statusError } = await supabase
      .from('content_schedule')
      .select('status')
      .gte('created_at', startDate.toISOString())

    if (statusError) {
      await systemLogger.error('Content Performance API', 'Failed to get status counts', { error: statusError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Calculate status distribution
    const statusDistribution = statusCounts?.reduce((acc: Record<string, number>, content: { status: string }) => {
      acc[content.status] = (acc[content.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get content by type for distribution
    const { data: typeCounts, error: typeError } = await supabase
      .from('content_schedule')
      .select('content_type')
      .gte('created_at', startDate.toISOString())

    if (typeError) {
      await systemLogger.error('Content Performance API', 'Failed to get type counts', { error: typeError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Calculate type distribution
    const typeDistribution = typeCounts?.reduce((acc: Record<string, number>, content: { content_type: string }) => {
      acc[content.content_type] = (acc[content.content_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate engagement rate (placeholder - would need actual engagement data)
    // For now, we'll use a simple calculation based on published content
    const engagementRate = totalPublished && totalPublished > 0 ? 75 : 0 // Placeholder value

    // Get top performing content (by engagement metrics if available)
    const { data: topContent, error: topError } = await supabase
      .from('content_schedule')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5)

    if (topError) {
      await systemLogger.error('Content Performance API', 'Failed to get top content', { error: topError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Get upcoming scheduled content
    const { data: upcomingContent, error: upcomingError } = await supabase
      .from('content_schedule')
      .select('*')
      .gte('scheduled_at', now.toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(10)

    if (upcomingError) {
      await systemLogger.error('Content Performance API', 'Failed to get upcoming content', { error: upcomingError })
      return NextResponse.json(
        { error: 'Failed to get metrics' },
        { status: 500 }
      )
    }

    // Calculate content velocity (content per day)
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const contentVelocity = daysDiff > 0 ? Math.round((totalScheduled || 0) / daysDiff * 10) / 10 : 0

    const metrics = {
      totalScheduled: totalScheduled || 0,
      totalPublished: totalPublished || 0,
      engagementRate,
      statusDistribution,
      typeDistribution,
      contentVelocity,
      topPerformingContent: topContent || [],
      upcomingContent: upcomingContent || [],
      timeRange
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    await systemLogger.error('Content Performance API', 'Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
