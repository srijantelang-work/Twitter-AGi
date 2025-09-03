import { createClient } from '@/lib/supabase/client'
import { 
  TwitterOAuthConnection, 
  CreateTwitterOAuthConnection, 
  UpdateTwitterOAuthConnection,
  TwitterConnectionStatus 
} from '@/types/database'
import { systemLogger } from '@/lib/logging/system-logger'

export class TwitterOAuthConnectionService {
  private supabase = createClient()

  /**
   * Create a new Twitter OAuth connection
   */
  async createConnection(connection: CreateTwitterOAuthConnection): Promise<TwitterOAuthConnection | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .insert(connection)
        .select()
        .single()

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to create connection', { error, connection })
        return null
      }

      await systemLogger.info('Twitter OAuth Service', 'Created new Twitter OAuth connection', { 
        userId: connection.user_id, 
        twitterUsername: connection.twitter_username 
      })

      return data
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception creating connection', { error, connection })
      return null
    }
  }

  /**
   * Get a Twitter OAuth connection by ID
   */
  async getConnectionById(id: string): Promise<TwitterOAuthConnection | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .select()
        .eq('id', id)
        .single()

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to get connection by ID', { error, id })
        return null
      }

      return data
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception getting connection by ID', { error, id })
      return null
    }
  }

  /**
   * Get Twitter OAuth connections for a user
   */
  async getConnectionsByUserId(userId: string): Promise<TwitterOAuthConnection[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to get connections by user ID', { error, userId })
        return []
      }

      return data || []
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception getting connections by user ID', { error, userId })
      return []
    }
  }

  /**
   * Get Twitter OAuth connection by Twitter user ID
   */
  async getConnectionByTwitterUserId(twitterUserId: string): Promise<TwitterOAuthConnection | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .select()
        .eq('twitter_user_id', twitterUserId)
        .single()

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to get connection by Twitter user ID', { error, twitterUserId })
        return null
      }

      return data
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception getting connection by Twitter user ID', { error, twitterUserId })
      return null
    }
  }

  /**
   * Update a Twitter OAuth connection
   */
  async updateConnection(id: string, updates: UpdateTwitterOAuthConnection): Promise<TwitterOAuthConnection | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to update connection', { error, id, updates })
        return null
      }

      await systemLogger.info('Twitter OAuth Service', 'Updated Twitter OAuth connection', { id, updates })

      return data
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception updating connection', { error, id, updates })
      return null
    }
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(id: string, status: TwitterConnectionStatus): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_twitter_connections')
        .update({ 
          connection_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to update connection status', { error, id, status })
        return false
      }

      await systemLogger.info('Twitter OAuth Service', 'Updated connection status', { id, status })

      return true
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception updating connection status', { error, id, status })
      return false
    }
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_twitter_connections')
        .update({ 
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to update last used', { error, id })
        return false
      }

      return true
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception updating last used', { error, id })
      return false
    }
  }

  /**
   * Delete a Twitter OAuth connection
   */
  async deleteConnection(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_twitter_connections')
        .delete()
        .eq('id', id)

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to delete connection', { error, id })
        return false
      }

      await systemLogger.info('Twitter OAuth Service', 'Deleted Twitter OAuth connection', { id })

      return true
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception deleting connection', { error, id })
      return false
    }
  }

  /**
   * Get all active connections
   */
  async getActiveConnections(): Promise<TwitterOAuthConnection[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .select()
        .eq('connection_status', 'connected')
        .order('last_used', { ascending: false })

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to get active connections', { error })
        return []
      }

      return data || []
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception getting active connections', { error })
      return []
    }
  }

  /**
   * Check if a user has an active Twitter connection
   */
  async hasActiveConnection(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('connection_status', 'connected')
        .limit(1)

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to check active connection', { error, userId })
        return false
      }

      return (data && data.length > 0)
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception checking active connection', { error, userId })
      return false
    }
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats(): Promise<{
    total: number
    connected: number
    disconnected: number
    error: number
    expired: number
  }> {
    try {
      const { data, error } = await this.supabase
        .from('user_twitter_connections')
        .select('connection_status')

      if (error) {
        await systemLogger.error('Twitter OAuth Service', 'Failed to get connection stats', { error })
        return { total: 0, connected: 0, disconnected: 0, error: 0, expired: 0 }
      }

      const stats = {
        total: data?.length || 0,
        connected: data?.filter(c => c.connection_status === 'connected').length || 0,
        disconnected: data?.filter(c => c.connection_status === 'disconnected').length || 0,
        error: data?.filter(c => c.connection_status === 'error').length || 0,
        expired: data?.filter(c => c.connection_status === 'expired').length || 0
      }

      return stats
    } catch (error) {
      await systemLogger.error('Twitter OAuth Service', 'Exception getting connection stats', { error })
      return { total: 0, connected: 0, disconnected: 0, error: 0, expired: 0 }
    }
  }
}

