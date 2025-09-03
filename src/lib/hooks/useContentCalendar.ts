import { useState, useEffect, useCallback } from 'react'
import { ContentCalendarSystem, ContentCalendarEvent, OptimalPostingTime } from '@/lib/content/calendar-system'

interface UseContentCalendarOptions {
  userId: string
  days?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseContentCalendarReturn {
  scheduledContent: ContentCalendarEvent[]
  optimalTimes: OptimalPostingTime[]
  varietyDistribution: any
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  scheduleContent: (
    contentId: string,
    scheduledAt: Date,
    postingTimeSlot: string,
    timezone?: string
  ) => Promise<any>
  updateScheduleStatus: (
    scheduleId: string,
    status: string,
    errorMessage?: string
  ) => Promise<void>
  canScheduleContent: (scheduledAt: Date) => Promise<boolean>
}

export function useContentCalendar({
  userId,
  days = 7,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute
}: UseContentCalendarOptions): UseContentCalendarReturn {
  const [scheduledContent, setScheduledContent] = useState<ContentCalendarEvent[]>([])
  const [optimalTimes, setOptimalTimes] = useState<OptimalPostingTime[]>([])
  const [varietyDistribution, setVarietyDistribution] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calendarSystem = new ContentCalendarSystem()

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [contentData, varietyData] = await Promise.all([
        calendarSystem.getScheduledContent(userId),
        calendarSystem.getContentVarietyDistribution(userId, days)
      ])

      // Map ContentSchedule to ContentCalendarEvent
      const mappedContent = contentData.map((item: any) => ({
        id: item.id,
        contentId: item.content_id,
        userId: item.user_id,
        scheduledAt: new Date(item.scheduled_at),
        postingTimeSlot: item.posting_time_slot,
        timezone: item.timezone,
        status: item.status,
        errorMessage: item.error_message,
        retryCount: item.retry_count,
        contentType: 'mixed', // Default value
        priority: 'medium' as const // Default value
      }))
      setScheduledContent(mappedContent)
      setVarietyDistribution(varietyData)

      // Get optimal posting times for today
      const todayOptimalTimes = await calendarSystem.calculateOptimalPostingTimes('networking_tips', new Date())
      setOptimalTimes(todayOptimalTimes)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch calendar data'
      setError(errorMessage)
      console.error('Error fetching calendar data:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, days, calendarSystem])

  const scheduleContent = useCallback(async (
    contentId: string,
    scheduledAt: Date,
    postingTimeSlot: string,
    timezone: string = 'UTC'
  ) => {
    try {
      const schedule = await calendarSystem.scheduleContent(
        contentId,
        userId,
        scheduledAt,
        postingTimeSlot,
        timezone
      )

      // Refresh calendar data after scheduling
      await fetchCalendarData()
      
      return schedule
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule content'
      setError(errorMessage)
      console.error('Error scheduling content:', err)
      throw err
    }
  }, [userId, calendarSystem, fetchCalendarData])

  const updateScheduleStatus = useCallback(async (
    scheduleId: string,
    status: string,
    errorMessage?: string
  ) => {
    try {
      await calendarSystem.updateScheduleStatus(scheduleId, status, errorMessage)
      
      // Refresh calendar data after status update
      await fetchCalendarData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule status'
      setError(errorMessage)
      console.error('Error updating schedule status:', err)
      throw err
    }
  }, [calendarSystem, fetchCalendarData])

  const canScheduleContent = useCallback(async (scheduledAt: Date): Promise<boolean> => {
    try {
      return await calendarSystem.canScheduleContent(userId, scheduledAt)
    } catch (err) {
      console.error('Error checking if content can be scheduled:', err)
      return false
    }
  }, [userId, calendarSystem])

  const refresh = useCallback(async () => {
    await fetchCalendarData()
  }, [fetchCalendarData])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchCalendarData, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchCalendarData])

  return {
    scheduledContent,
    optimalTimes,
    varietyDistribution,
    loading,
    error,
    refresh,
    scheduleContent,
    updateScheduleStatus,
    canScheduleContent
  }
}
