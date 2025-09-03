import { createClient } from '@/lib/supabase/server'
import { SystemLog, CreateSystemLog } from '@/types/database'

export class SystemLogger {
  /**
   * Log a debug message
   */
  async debug(category: string, message: string, metadata?: Record<string, unknown>, userId?: string): Promise<void> {
    await this.log('debug', category, message, metadata, userId)
  }

  /**
   * Log an info message
   */
  async info(category: string, message: string, metadata?: Record<string, unknown>, userId?: string): Promise<void> {
    await this.log('info', category, message, metadata, userId)
  }

  /**
   * Log a warning message
   */
  async warn(category: string, message: string, metadata?: Record<string, unknown>, userId?: string): Promise<void> {
    await this.log('warn', category, message, metadata, userId)
  }

  /**
   * Log an error message
   */
  async error(category: string, message: string, metadata?: Record<string, unknown>, userId?: string): Promise<void> {
    await this.log('error', category, message, metadata, userId)
  }

  /**
   * Log a message with the specified level
   */
  private async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: string,
    message: string,
    metadata?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    try {
      const logEntry: CreateSystemLog = {
        level,
        category,
        message,
        metadata,
        user_id: userId
      }

      const supabase = await createClient()
      const { error } = await supabase
        .from('system_logs')
        .insert(logEntry)

      if (error) {
        // Enhanced error handling for RLS violations
        if (error.code === '42501') {
          console.warn(`RLS policy violation for system_logs: ${error.message}`)
          console.warn(`Falling back to console logging for: [${category}] ${message}`)
        } else {
          console.error('Failed to log to database:', error)
        }
        // Always fallback to console logging
        this.consoleLog(level, category, message, metadata)
      }
    } catch (error) {
      console.error('System logger error:', error)
      // Always fallback to console logging
      this.consoleLog(level, category, message, metadata)
    }
  }

  /**
   * Console logging fallback
   */
  private consoleLog(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, metadata || '')
        break
      case 'info':
        console.info(logMessage, metadata || '')
        break
      case 'warn':
        console.warn(logMessage, metadata || '')
        break
      case 'error':
        console.error(logMessage, metadata || '')
        break
    }
  }

  /**
   * Get logs with optional filtering
   */
  async getLogs(filters?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    category?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SystemLog[]> {
    try {
      const supabase = await createClient()
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.level) {
        query = query.eq('level', filters.level)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getLogs:', error)
      return []
    }
  }

  /**
   * Clear old logs (keep only last N days)
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const supabase = await createClient()
      const { error, count } = await supabase
        .from('system_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Error clearing old logs:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in clearOldLogs:', error)
      return 0
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(): Promise<{
    total: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
  }> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('system_logs')
        .select('level')

      if (error) {
        console.error('Error fetching log stats:', error)
        return { total: 0, debug: 0, info: 0, warn: 0, error: 0 }
      }

      const stats = {
        total: data?.length || 0,
        debug: data?.filter(l => l.level === 'debug').length || 0,
        info: data?.filter(l => l.level === 'info').length || 0,
        warn: data?.filter(l => l.level === 'warn').length || 0,
        error: data?.filter(l => l.level === 'error').length || 0,
      }

      return stats
    } catch (error) {
      console.error('Error in getLogStats:', error)
      return { total: 0, debug: 0, info: 0, warn: 0, error: 0 }
    }
  }
}

// Export singleton instance
export const systemLogger = new SystemLogger()
