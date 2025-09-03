import { useState, useEffect, useCallback } from 'react'
import { ContentAnalyticsService, ContentPerformanceMetrics, ContentAnalytics, PerformanceInsight } from '@/lib/analytics/content-analytics'

interface UseContentPerformanceOptions {
  userId: string
  days?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseContentPerformanceReturn {
  analytics: ContentAnalytics | null
  insights: PerformanceInsight[]
  trendingTopics: string[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  trackPerformance: (contentId: string, metrics: Partial<ContentPerformanceMetrics>) => Promise<void>
}

export function useContentPerformance({
  userId,
  days = 30,
  autoRefresh = true,
  refreshInterval = 300000 // 5 minutes
}: UseContentPerformanceOptions): UseContentPerformanceReturn {
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null)
  const [insights, setInsights] = useState<PerformanceInsight[]>([])
  const [trendingTopics, setTrendingTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const analyticsService = new ContentAnalyticsService()

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [analyticsData, insightsData, topicsData] = await Promise.all([
        analyticsService.getUserContentAnalytics(userId, days),
        analyticsService.getPerformanceInsights(userId),
        analyticsService.getTrendingTopics(7)
      ])

      setAnalytics(analyticsData)
      setInsights(insightsData)
      setTrendingTopics(topicsData)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics'
      setError(errorMessage)
      console.error('Error fetching content analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, days, analyticsService])

  const trackPerformance = useCallback(async (
    contentId: string, 
    metrics: Partial<ContentPerformanceMetrics>
  ) => {
    try {
      await analyticsService.trackContentPerformance(contentId, metrics)
      
      // Refresh analytics after tracking new performance data
      await fetchAnalytics()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track performance'
      setError(errorMessage)
      console.error('Error tracking content performance:', err)
    }
  }, [analyticsService, fetchAnalytics])

  const refresh = useCallback(async () => {
    await fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchAnalytics, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchAnalytics])

  return {
    analytics,
    insights,
    trendingTopics,
    loading,
    error,
    refresh,
    trackPerformance
  }
}
