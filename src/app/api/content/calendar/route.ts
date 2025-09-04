import { NextRequest, NextResponse } from 'next/server'
import { ContentCalendarSystem } from '@/lib/content/calendar-system'
import { ContentQueueManager } from '@/lib/content/queue-manager'
import { systemLogger } from '@/lib/logging/system-logger'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentId, userId, scheduledAt, postingTimeSlot, timezone } = body

    if (!contentId || !userId || !scheduledAt || !postingTimeSlot) {
      return NextResponse.json(
        { error: 'Content ID, user ID, scheduled date, and posting time slot are required' },
        { status: 400 }
      )
    }

    const calendarSystem = new ContentCalendarSystem()
    const queueManager = new ContentQueueManager()

    // Check if content can be scheduled
    const canSchedule = await calendarSystem.canScheduleContent(userId, new Date(scheduledAt))
    
    if (!canSchedule) {
      return NextResponse.json(
        { error: 'Daily posting limit reached or content cannot be scheduled for this time' },
        { status: 400 }
      )
    }

    // Schedule the content
    const schedule = await calendarSystem.scheduleContent(
      contentId,
      userId,
      new Date(scheduledAt),
      postingTimeSlot,
      timezone || 'UTC'
    )

    // Add to approval queue if needed
    await queueManager.addToQueue(contentId, userId)

    await systemLogger.info('Content API', 'Content scheduled successfully', {
      contentId,
      userId,
      scheduledAt,
      postingTimeSlot
    })

    return NextResponse.json({
      success: true,
      data: {
        schedule,
        message: 'Content scheduled successfully'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Content API', 'Content scheduling failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to schedule content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
    const status = searchParams.get('status')
    const days = parseInt(searchParams.get('days') || '7')

    const calendarSystem = new ContentCalendarSystem()

    // Get scheduled content for authenticated user
    const scheduledContent = await calendarSystem.getScheduledContent(user.id, status || undefined)

    // Get content variety distribution for authenticated user
    const varietyDistribution = await calendarSystem.getContentVarietyDistribution(user.id, days)

    await systemLogger.info('Content API', 'Calendar data retrieved', {
      userId: user.id,
      contentCount: scheduledContent.length,
      days
    })

    return NextResponse.json({
      success: true,
      data: {
        scheduledContent,
        varietyDistribution,
        total: scheduledContent.length,
        days
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Content API', 'Calendar data retrieval failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve calendar data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, updates } = body

    if (!scheduleId || !updates) {
      return NextResponse.json(
        { error: 'Schedule ID and updates are required' },
        { status: 400 }
      )
    }

    const calendarSystem = new ContentCalendarSystem()

    // Update schedule status
    if (updates.status) {
      await calendarSystem.updateScheduleStatus(scheduleId, updates.status, updates.errorMessage)
    }

    await systemLogger.info('Content API', 'Schedule updated successfully', {
      scheduleId,
      updates
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Schedule updated successfully',
        scheduleId
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Content API', 'Schedule update failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to update schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const calendarSystem = new ContentCalendarSystem()

    // Update schedule status to cancelled
    await calendarSystem.updateScheduleStatus(scheduleId, 'cancelled')

    await systemLogger.info('Content API', 'Schedule cancelled successfully', {
      scheduleId
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Schedule cancelled successfully',
        scheduleId
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Content API', 'Schedule cancellation failed', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
