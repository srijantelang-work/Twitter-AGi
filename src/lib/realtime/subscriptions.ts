import { createClient } from '@/lib/supabase/client'

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export class RealtimeService {
  private supabase: ReturnType<typeof createClient> | null = null
  private subscriptions: Map<string, unknown> = new Map()
  private eventSource: EventSource | null = null
  private isStreaming = false

  constructor() {
    // Only initialize Supabase client in browser environment
    if (typeof window !== 'undefined') {
      try {
        this.supabase = createClient()
      } catch (error) {
        console.warn('Failed to initialize Supabase client:', error)
      }
    }
  }

  /**
   * Subscribe to monitored tweets changes
   */
  subscribeToTweets(
    callback: (payload: RealtimePayload) => void,
    filters?: { status?: string; author_id?: string }
  ): string {
    if (!this.supabase) {
      console.warn('Supabase client not available')
      return 'no_client'
    }

    try {
      const channel = this.supabase
        .channel('monitored_tweets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'monitored_tweets',
            filter: filters?.status ? `status=eq.${filters.status}` : undefined
          },
          callback
        )
        .subscribe()

      const id = `tweets_${Date.now()}`
      this.subscriptions.set(id, channel)

      return id
    } catch (error) {
      console.error('Failed to subscribe to tweets:', error)
      return 'error'
    }
  }

  /**
   * Start live monitoring stream
   */
  startLiveStream(
    callback: (data: unknown) => void,
    filters?: { keywords?: string; intent?: string; sentiment?: string; priority?: string; status?: string }
  ): string {
    if (this.isStreaming) {
      console.warn('Live stream already active')
      return 'stream_active'
    }

    const streamId = `live_stream_${Date.now()}`
    
    // Start the stream via API
    fetch('/api/twitter/live-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start-stream',
        filters
      })
    }).then(response => response.json())
    .then(data => {
      if (data.success) {
        this.isStreaming = true
        console.log('Live stream started:', data.streamId)
      }
    })
    .catch(error => {
      console.error('Failed to start live stream:', error)
    })

    // Also subscribe to Supabase real-time changes for immediate updates
    if (this.supabase) {
      try {
        const channel = this.supabase
          .channel(`live_monitoring_${streamId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'monitored_tweets'
            },
            (payload) => {
              callback({
                type: 'realtime_update',
                data: payload,
                timestamp: new Date().toISOString()
              })
            }
          )
          .subscribe()

        this.subscriptions.set(streamId, channel)
      } catch (error) {
        console.error('Failed to subscribe to live monitoring:', error)
      }
    }
    
    this.isStreaming = true

    return streamId
  }

  /**
   * Stop live monitoring stream
   */
  stopLiveStream(streamId: string): boolean {
    const subscription = this.subscriptions.get(streamId)
    if (subscription) {
      // Unsubscribe from Supabase
      if (typeof subscription === 'object' && subscription !== null && 'unsubscribe' in subscription) {
        (subscription as { unsubscribe: () => void }).unsubscribe()
      }
      this.subscriptions.delete(streamId)
      
      // Stop the API stream
      fetch('/api/twitter/live-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop-stream' })
      }).catch(error => {
        console.error('Failed to stop live stream:', error)
      })
      
      this.isStreaming = false
      return true
    }
    return false
  }

  /**
   * Subscribe to agent responses changes
   */
  subscribeToResponses(
    callback: (payload: RealtimePayload) => void,
    filters?: { status?: string; created_by?: string }
  ): string {
    if (!this.supabase) {
      console.warn('Supabase client not available')
      return 'no_client'
    }

    try {
      const channel = this.supabase
        .channel('agent_responses_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agent_responses',
            filter: filters?.status ? `status=eq.${filters.status}` : undefined
          },
          callback
        )
        .subscribe()

      const id = `responses_${Date.now()}`
      this.subscriptions.set(id, channel)

      return id
    } catch (error) {
      console.error('Failed to subscribe to responses:', error)
      return 'error'
    }
  }

  /**
   * Subscribe to content schedule changes
   */
  subscribeToContent(
    callback: (payload: RealtimePayload) => void,
    filters?: { status?: string; created_by?: string }
  ): string {
    if (!this.supabase) {
      console.warn('Supabase client not available')
      return 'no_client'
    }

    try {
      const channel = this.supabase
        .channel('content_schedule_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'content_schedule',
            filter: filters?.status ? `status=eq.${filters.status}` : undefined
          },
          callback
        )
        .subscribe()

      const id = `content_${Date.now()}`
      this.subscriptions.set(id, channel)

      return id
    } catch (error) {
      console.error('Failed to subscribe to content:', error)
      return 'error'
    }
  }

  /**
   * Subscribe to system logs (admin only)
   */
  subscribeToLogs(
    callback: (payload: RealtimePayload) => void,
    filters?: { level?: string; category?: string }
  ): string {
    if (!this.supabase) {
      console.warn('Supabase client not available')
      return 'no_client'
    }

    try {
      const channel = this.supabase
        .channel('system_logs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'system_logs',
            filter: filters?.level ? `level=eq.${filters.level}` : undefined
          },
          callback
        )
        .subscribe()

      const id = `logs_${Date.now()}`
      this.subscriptions.set(id, channel)

      return id
    } catch (error) {
      console.error('Failed to subscribe to logs:', error)
      return 'error'
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): boolean {
    const channel = this.subscriptions.get(subscriptionId) as { unsubscribe: () => void } | undefined
    if (channel) {
      try {
        channel.unsubscribe()
        this.subscriptions.delete(subscriptionId)
        return true
      } catch (error) {
        console.error('Failed to unsubscribe:', error)
        return false
      }
    }
    return false
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((channel) => {
      try {
        (channel as { unsubscribe: () => void }).unsubscribe()
      } catch (error) {
        console.error('Failed to unsubscribe from channel:', error)
      }
    })
    this.subscriptions.clear()
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys())
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()
