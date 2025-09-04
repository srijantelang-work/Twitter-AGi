/**
 * Content Queue Manager
 * 
 * Manages content approval workflow, automated posting triggers,
 * and content performance tracking for the AI Superconnector brand.
 */

import { createClient } from '@/lib/supabase/client'
import { getSuperconnectorConfig } from '@/lib/config/ai-config'
import { systemLogger } from '@/lib/logging/system-logger'
import { ContentCalendarSystem } from './calendar-system'

export interface ContentQueueItem {
  id: string
  contentId: string
  userId: string
  contentType: string
  content: string
  hashtags: string[]
  emojis: string[]
  status: 'pending' | 'approved' | 'rejected' | 'requires_changes'
  priority: 'high' | 'medium' | 'low'
  scheduledAt?: Date
  approverId?: string
  feedback?: string
  createdAt: Date
  updatedAt: Date
}

export interface ContentApprovalRequest {
  contentId: string
  approverId: string
  status: 'approved' | 'rejected' | 'requires_changes'
  feedback?: string
}

export interface ContentPostingResult {
  success: boolean
  twitterPostId?: string
  errorMessage?: string
  engagementMetrics?: {
    likes: number
    retweets: number
    replies: number
    impressions: number
  }
}

export class ContentQueueManager {
  private supabase = createClient()
  private config = getSuperconnectorConfig()
  private calendarSystem = new ContentCalendarSystem()

  /**
   * Add content to the approval queue
   */
  async addToQueue(contentId: string, userId: string): Promise<void> {
    try {
      // Get content details
      const { data: content, error: contentError } = await this.supabase
        .from('ai_superconnector_content')
        .select('*')
        .eq('id', contentId)
        .single()

      if (contentError) {
        throw contentError
      }

      // Create approval record
      const { error: approvalError } = await this.supabase
        .from('content_approval')
        .insert({
          content_id: contentId,
          status: 'pending'
        })

      if (approvalError) {
        throw approvalError
      }

      // Update content status to pending approval
      const { error: updateError } = await this.supabase
        .from('ai_superconnector_content')
        .update({ status: 'pending' })
        .eq('id', contentId)

      if (updateError) {
        throw updateError
      }

      await systemLogger.info('ContentQueueManager', 'Content added to approval queue', {
        contentId,
        userId,
        contentType: content.content_type
      })
      
    } catch (error) {
      await systemLogger.error('ContentQueueManager', 'Failed to add content to queue', { error, contentId, userId })
      throw error
    }
  }

  /**
   * Process content approval
   */
  async processApproval(request: ContentApprovalRequest): Promise<void> {
    try {
      const { contentId, approverId, status, feedback } = request

      // Update approval record
      const { error: approvalError } = await this.supabase
        .from('content_approval')
        .update({
          approver_id: approverId,
          status,
          feedback,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('content_id', contentId)

      if (approvalError) {
        throw approvalError
      }

      // Update content status
      const contentStatus = status === 'approved' ? 'approved' : 'rejected'
      const { error: contentError } = await this.supabase
        .from('ai_superconnector_content')
        .update({ status: contentStatus })
        .eq('id', contentId)

      if (contentError) {
        throw contentError
      }

      // If approved, schedule for posting
      if (status === 'approved') {
        await this.scheduleApprovedContent(contentId)
      }

      await systemLogger.info('ContentQueueManager', 'Content approval processed', {
        contentId,
        approverId,
        status,
        feedback
      })
      
    } catch (error) {
      await systemLogger.error('ContentQueueManager', 'Failed to process approval', { error, request })
      throw error
    }
  }

  /**
   * Schedule approved content for posting
   */
  private async scheduleApprovedContent(contentId: string): Promise<void> {
    try {
      // Get content details
      const { data: content, error: contentError } = await this.supabase
        .from('ai_superconnector_content')
        .select('*')
        .eq('id', contentId)
        .single()

      if (contentError) {
        throw contentError
      }

      // Calculate optimal posting time
      const optimalTimes = await this.calendarSystem.calculateOptimalPostingTimes(
        content.content_type,
        new Date()
      )

      if (optimalTimes.length === 0) {
        throw new Error('No optimal posting times available')
      }

      // Select the best time slot
      const bestTime = optimalTimes[0]
      const scheduledAt = this.calculateScheduledTime(bestTime.timeSlot)

      // Check if we can schedule content
      const canSchedule = await this.calendarSystem.canScheduleContent(
        content.user_id,
        scheduledAt
      )

      if (!canSchedule) {
        // Try next available time
        const nextTime = optimalTimes[1]
        if (nextTime) {
          scheduledAt.setDate(scheduledAt.getDate() + 1)
        }
      }

      // Schedule the content
      await this.calendarSystem.scheduleContent(
        contentId,
        content.user_id,
        scheduledAt,
        bestTime.timeSlot,
        'UTC'
      )

      await systemLogger.info('ContentQueueManager', 'Approved content scheduled', {
        contentId,
        scheduledAt: scheduledAt.toISOString(),
        timeSlot: bestTime.timeSlot
      })
      
    } catch (error) {
      await systemLogger.error('ContentQueueManager', 'Failed to schedule approved content', { error, contentId })
      throw error
    }
  }

  /**
   * Calculate scheduled time from time slot
   */
  private calculateScheduledTime(timeSlot: string): Date {
    const now = new Date()
    const [time, period] = timeSlot.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    
    let targetHours = hours
    if (period === 'PM' && hours !== 12) {
      targetHours += 12
    } else if (period === 'AM' && hours === 12) {
      targetHours = 0
    }

    const scheduledAt = new Date(now)
    scheduledAt.setHours(targetHours, minutes, 0, 0)

    // If the time has passed today, schedule for tomorrow
    if (scheduledAt <= now) {
      scheduledAt.setDate(scheduledAt.getDate() + 1)
    }

    return scheduledAt
  }

  /**
   * Get content ready for posting
   */
  async getContentReadyForPosting(): Promise<ContentQueueItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_superconnector_content')
        .select(`
          *,
          content_approval (
            status,
            feedback
          )
        `)
        .eq('status', 'approved')
        .not('content_approval.status', 'eq', 'rejected')

      if (error) {
        throw error
      }

      return data.map(item => this.mapQueueItem(item))
      
    } catch (error) {
      await systemLogger.error('ContentQueueManager', 'Failed to get content ready for posting', { error })
      throw error
    }
  }

  /**
   * Get pending approval content
   */
  async getPendingApprovals(): Promise<ContentQueueItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_superconnector_content')
        .select(`
          *,
          content_approval (
            status,
            feedback
          )
        `)
        .eq('status', 'pending')

      if (error) {
        throw error
      }

      return data.map(item => this.mapQueueItem(item))
      
    } catch (error) {
      await systemLogger.error('ContentQueueManager', 'Failed to get pending approvals', { error })
      throw error
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<{
    pending: number
    approved: number
    rejected: number
    total: number
  }> {
    try {
      const { data, error } = await this.supabase
        .from('content_approval')
        .select('status')

      if (error) {
        throw error
      }

      const stats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: data.length
      }

      data.forEach(item => {
        switch (item.status) {
          case 'pending':
            stats.pending++
            break
          case 'approved':
            stats.approved++
            break
          case 'rejected':
            stats.rejected++
            break
        }
      })

      return stats
      
    } catch (error) {
      await systemLogger.error('ContentQueueManager', 'Failed to get queue statistics', { error })
      return { pending: 0, approved: 0, rejected: 0, total: 0 }
    }
  }

  /**
   * Map database data to ContentQueueItem interface
   */
  private mapQueueItem(data: {
    id: string
    user_id: string
    content_type: string
    content: string
    hashtags?: string[]
    emojis?: string[]
    confidence_score: number
    scheduled_at?: string
    created_at: string
    updated_at: string
    content_approval?: Array<{
      status: 'pending' | 'approved' | 'rejected' | 'requires_changes'
      approver_id?: string
      feedback?: string
    }>
  }): ContentQueueItem {
    return {
      id: data.id,
      contentId: data.id,
      userId: data.user_id,
      contentType: data.content_type,
      content: data.content,
      hashtags: data.hashtags || [],
      emojis: data.emojis || [],
      status: data.content_approval?.[0]?.status || 'pending',
      priority: this.calculatePriority(data.content_type, data.confidence_score),
      scheduledAt: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      approverId: data.content_approval?.[0]?.approver_id,
      feedback: data.content_approval?.[0]?.feedback,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Calculate content priority
   */
  private calculatePriority(contentType: string, confidenceScore: number): 'high' | 'medium' | 'low' {
    let priority = 'medium'

    // High priority for high-confidence content
    if (confidenceScore >= 0.9) {
      priority = 'high'
    }
    // Low priority for low-confidence content
    else if (confidenceScore < 0.7) {
      priority = 'low'
    }

    // Boost priority for certain content types
    if (['networking_tips', 'ai_insights'].includes(contentType)) {
      if (priority === 'medium') priority = 'high'
      if (priority === 'low') priority = 'medium'
    }

    return priority as 'high' | 'medium' | 'low'
  }

  /**
   * Process content posting results
   */
  async processPostingResult(
    contentId: string,
    result: ContentPostingResult
  ): Promise<void> {
    try {
      if (result.success) {
        // Update content with Twitter post ID
        const { error: updateError } = await this.supabase
          .from('ai_superconnector_content')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            twitter_post_id: result.twitterPostId
          })
          .eq('id', contentId)

        if (updateError) {
          throw updateError
        }

        // Create performance tracking record
        if (result.engagementMetrics) {
          const { error: performanceError } = await this.supabase
            .from('content_performance')
            .insert({
              content_id: contentId,
              performance_metrics: result.engagementMetrics
            })

          if (performanceError) {
            await systemLogger.warn('ContentQueueManager', 'Failed to create performance record', { error: performanceError })
          }
        }
      } else {
        // Handle posting failure
        const { error: updateError } = await this.supabase
          .from('ai_superconnector_content')
          .update({
            status: 'failed'
          })
          .eq('id', contentId)

        if (updateError) {
          throw updateError
        }
      }

      await systemLogger.info('ContentQueueManager', 'Posting result processed', {
        contentId,
        success: result.success,
        twitterPostId: result.twitterPostId,
        errorMessage: result.errorMessage
      })
      
    } catch (error) {
      await systemLogger.error('ContentQueueManager', 'Failed to process posting result', { error, contentId, result })
      throw error
    }
  }
}
