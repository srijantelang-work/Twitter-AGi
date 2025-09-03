/**
 * Content Calendar System
 * 
 * Manages automated content scheduling, optimal posting time calculation,
 * and content variety distribution for the AI Superconnector brand.
 */

import { createClient } from '@/lib/supabase/client'
import { getSuperconnectorConfig } from '@/lib/config/ai-config'
import { systemLogger } from '@/lib/logging/system-logger'

export interface ContentCalendarEvent {
  id: string
  contentId: string
  scheduledAt: Date
  postingTimeSlot: string
  timezone: string
  status: 'scheduled' | 'queued' | 'posting' | 'posted' | 'failed' | 'cancelled'
  contentType: string
  priority: 'high' | 'medium' | 'low'
}

export interface OptimalPostingTime {
  timeSlot: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  engagementScore: number
  contentType: string
  reasoning: string
}

export interface ContentSchedule {
  id: string
  contentId: string
  userId: string
  scheduledAt: Date
  postingTimeSlot: string
  timezone: string
  status: string
  retryCount: number
  maxRetries: number
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export class ContentCalendarSystem {
  private supabase = createClient()
  private config = getSuperconnectorConfig()

  /**
   * Calculate optimal posting times for content
   */
  async calculateOptimalPostingTimes(
    contentType: string,
    targetDate: Date = new Date()
  ): Promise<OptimalPostingTime[]> {
    try {
      // Get content theme data for optimal times
      const { data: themeData, error: themeError } = await this.supabase
        .from('content_themes')
        .select('optimal_posting_times, engagement_patterns')
        .eq('name', contentType)
        .single()

      if (themeError) {
        await systemLogger.warn('ContentCalendarSystem', 'Failed to fetch theme data', { error: themeError, contentType })
        return this.getDefaultOptimalTimes(contentType)
      }

      const optimalTimes = themeData?.optimal_posting_times || []
      const engagementPatterns = themeData?.engagement_patterns || {}

      // Calculate optimal times for the next 7 days
      const optimalPostingTimes: OptimalPostingTime[] = []
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDay = new Date(targetDate)
        targetDay.setDate(targetDate.getDate() + dayOffset)
        
        for (const timeSlot of optimalTimes) {
          const engagementScore = this.calculateEngagementScore(
            timeSlot,
            targetDay.getDay(),
            contentType,
            engagementPatterns
          )
          
          optimalPostingTimes.push({
            timeSlot,
            dayOfWeek: targetDay.getDay(),
            engagementScore,
            contentType,
            reasoning: this.generateEngagementReasoning(timeSlot, targetDay.getDay().toString(), contentType)
          })
        }
      }

      // Sort by engagement score (highest first)
      optimalPostingTimes.sort((a, b) => b.engagementScore - a.engagementScore)
      
      return optimalPostingTimes.slice(0, 10) // Return top 10 options
      
    } catch (error) {
      await systemLogger.error('ContentCalendarSystem', 'Failed to calculate optimal posting times', { error, contentType })
      return this.getDefaultOptimalTimes(contentType)
    }
  }

  /**
   * Schedule content for posting
   */
  async scheduleContent(
    contentId: string,
    userId: string,
    scheduledAt: Date,
    postingTimeSlot: string,
    timezone: string = 'UTC'
  ): Promise<ContentSchedule> {
    try {
      const { data, error } = await this.supabase
        .from('content_schedule')
        .insert({
          content_id: contentId,
          user_id: userId,
          scheduled_at: scheduledAt.toISOString(),
          posting_time_slot: postingTimeSlot,
          timezone,
          status: 'scheduled'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      await systemLogger.info('ContentCalendarSystem', 'Content scheduled successfully', {
        contentId,
        userId,
        scheduledAt: scheduledAt.toISOString(),
        postingTimeSlot
      })

      return this.mapScheduleData(data)
      
    } catch (error) {
      await systemLogger.error('ContentCalendarSystem', 'Failed to schedule content', { error, contentId, userId })
      throw error
    }
  }

  /**
   * Get scheduled content for a user
   */
  async getScheduledContent(userId: string, status?: string): Promise<ContentSchedule[]> {
    try {
      let query = this.supabase
        .from('content_schedule')
        .select(`
          *,
          ai_superconnector_content (
            id,
            content_type,
            content,
            hashtags,
            emojis
          )
        `)
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data.map(item => this.mapScheduleData(item))
      
    } catch (error) {
      await systemLogger.error('ContentCalendarSystem', 'Failed to get scheduled content', { error, userId })
      throw error
    }
  }

  /**
   * Get content ready for posting
   */
  async getContentReadyForPosting(): Promise<ContentSchedule[]> {
    try {
      const now = new Date()
      const { data, error } = await this.supabase
        .from('content_schedule')
        .select(`
          *,
          ai_superconnector_content (
            id,
            content_type,
            content,
            hashtags,
            emojis,
            engagement_prompt
          )
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_at', now.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) {
        throw error
      }

      return data.map(item => this.mapScheduleData(item))
      
    } catch (error) {
      await systemLogger.error('ContentCalendarSystem', 'Failed to get content ready for posting', { error })
      throw error
    }
  }

  /**
   * Update content schedule status
   */
  async updateScheduleStatus(
    scheduleId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = { status }
      
      if (status === 'posted') {
        updateData.posted_at = new Date().toISOString()
      } else if (status === 'failed') {
        updateData.error_message = errorMessage
        updateData.retry_count = (updateData.retry_count || 0) + 1
      }

      const { error } = await this.supabase
        .from('content_schedule')
        .update(updateData)
        .eq('id', scheduleId)

      if (error) {
        throw error
      }

      await systemLogger.info('ContentCalendarSystem', 'Schedule status updated', {
        scheduleId,
        status,
        errorMessage
      })
      
    } catch (error) {
      await systemLogger.error('ContentCalendarSystem', 'Failed to update schedule status', { error, scheduleId, status })
      throw error
    }
  }

  /**
   * Get content variety distribution for scheduling
   */
  async getContentVarietyDistribution(userId: string, days: number = 7): Promise<Record<string, number>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from('content_schedule')
        .select(`
          ai_superconnector_content (
            content_type
          )
        `)
        .eq('user_id', userId)
        .gte('scheduled_at', startDate.toISOString())
        .eq('status', 'posted')

      if (error) {
        throw error
      }

      const distribution: Record<string, number> = {}
      
      data.forEach(item => {
        const contentType = item.ai_superconnector_content?.[0]?.content_type
        if (contentType) {
          distribution[contentType] = (distribution[contentType] || 0) + 1
        }
      })

      return distribution
      
    } catch (error) {
      await systemLogger.error('ContentCalendarSystem', 'Failed to get content variety distribution', { error, userId })
      return {}
    }
  }

  /**
   * Calculate engagement score for a time slot
   */
  private calculateEngagementScore(
    timeSlot: string,
    dayOfWeek: number,
    contentType: string,
    engagementPatterns: any
  ): number {
    let score = 0.5 // Base score

    // Time slot scoring (based on general social media engagement patterns)
    const timeScores: Record<string, number> = {
      '9:00 AM': 0.8,   // Morning commute
      '10:00 AM': 0.7,  // Work hours
      '11:00 AM': 0.6,  // Pre-lunch
      '12:00 PM': 0.9,  // Lunch break
      '1:00 PM': 0.6,   // Post-lunch
      '2:00 PM': 0.7,   // Afternoon work
      '3:00 PM': 0.8,   // Afternoon break
      '4:00 PM': 0.7,   // End of work day
      '5:00 PM': 0.8,   // Commute home
      '6:00 PM': 0.9,   // Evening relaxation
      '7:00 PM': 0.8    // Evening engagement
    }

    score += timeScores[timeSlot] || 0.5

    // Day of week scoring
    const dayScores: Record<number, number> = {
      0: 0.6, // Sunday
      1: 0.8, // Monday
      2: 0.8, // Tuesday
      3: 0.8, // Wednesday
      4: 0.8, // Thursday
      5: 0.9, // Friday
      6: 0.7  // Saturday
    }

    score += dayScores[dayOfWeek] || 0.5

    // Content type specific scoring
    if (engagementPatterns[contentType]) {
      score += 0.1
    }

    return Math.min(1.0, Math.max(0.0, score))
  }

  /**
   * Generate engagement reasoning
   */
  private generateEngagementReasoning(timeSlot: string, dayOfWeek: string, contentType: string): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayIndex = parseInt(dayOfWeek)
    const dayName = dayNames[dayIndex] || 'Unknown'
    
    return `Optimal posting time: ${timeSlot} on ${dayName} for ${contentType} content. This time slot typically sees high engagement based on user behavior patterns.`
  }

  /**
   * Get default optimal times when theme data is unavailable
   */
  private getDefaultOptimalTimes(contentType: string): OptimalPostingTime[] {
    const defaultTimes = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM']
    const today = new Date()
    
    return defaultTimes.map((timeSlot, index) => ({
      timeSlot,
      dayOfWeek: today.getDay(),
      engagementScore: 0.7 + (index * 0.05),
      contentType,
      reasoning: `Default optimal time: ${timeSlot} for ${contentType} content`
    }))
  }

  /**
   * Map database data to ContentSchedule interface
   */
  private mapScheduleData(data: any): ContentSchedule {
    return {
      id: data.id,
      contentId: data.content_id,
      userId: data.user_id,
      scheduledAt: new Date(data.scheduled_at),
      postingTimeSlot: data.posting_time_slot,
      timezone: data.timezone,
      status: data.status,
      retryCount: data.retry_count,
      maxRetries: data.max_retries,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Check if content can be scheduled (rate limiting)
   */
  async canScheduleContent(userId: string, targetDate: Date): Promise<boolean> {
    try {
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { count, error } = await this.supabase
        .from('content_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .in('status', ['scheduled', 'queued'])

      if (error) {
        throw error
      }

      const maxDailyPosts = this.config.postingSchedule.maxDailyPosts || 5
      return (count || 0) < maxDailyPosts
      
    } catch (error) {
      await systemLogger.error('ContentCalendarSystem', 'Failed to check scheduling availability', { error, userId })
      return false
    }
  }
}
