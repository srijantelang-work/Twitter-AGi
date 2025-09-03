import { createClient } from '@/lib/supabase/client'
import { systemLogger } from '@/lib/logging/system-logger'

export interface IntentFilter {
  id: string
  user_id: string
  keyword: string
  created_at: string
}

export class IntentFiltersService {
  private supabase = createClient()

  /**
   * Get all intent filters for a user
   */
  async getUserFilters(userId: string): Promise<IntentFilter[]> {
    try {
      const { data, error } = await this.supabase
        .from('intent_filters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          await systemLogger.error('IntentFiltersService', 'Table intent_filters does not exist', { userId, error })
          throw new Error('Database table "intent_filters" does not exist. Please run the database migration first.')
        }
        await systemLogger.error('IntentFiltersService', 'Failed to fetch user filters', { userId, error })
        throw error
      }

      return data || []
    } catch (error) {
      await systemLogger.error('IntentFiltersService', 'Error in getUserFilters', { userId, error })
      throw error
    }
  }

  /**
   * Add a new intent filter for a user
   */
  async addFilter(userId: string, keyword: string): Promise<IntentFilter> {
    try {
      const { data, error } = await this.supabase
        .from('intent_filters')
        .insert({
          user_id: userId,
          keyword: keyword.trim()
        })
        .select()
        .single()

      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          await systemLogger.error('IntentFiltersService', 'Table intent_filters does not exist', { userId, keyword, error })
          throw new Error('Database table "intent_filters" does not exist. Please run the database migration first.')
        }
        await systemLogger.error('IntentFiltersService', 'Failed to add filter', { userId, keyword, error })
        throw error
      }

      await systemLogger.info('IntentFiltersService', 'Filter added successfully', { userId, keyword, filterId: data.id })
      return data
    } catch (error) {
      await systemLogger.error('IntentFiltersService', 'Error in addFilter', { userId, keyword, error })
      throw error
    }
  }

  /**
   * Remove an intent filter
   */
  async removeFilter(filterId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('intent_filters')
        .delete()
        .eq('id', filterId)
        .eq('user_id', userId)

      if (error) {
        await systemLogger.error('IntentFiltersService', 'Failed to remove filter', { filterId, userId, error })
        throw error
      }

      await systemLogger.info('IntentFiltersService', 'Filter removed successfully', { filterId, userId })
    } catch (error) {
      await systemLogger.error('IntentFiltersService', 'Error in removeFilter', { filterId, userId, error })
      throw error
    }
  }

  /**
   * Get all keywords for a user as a simple array
   */
  async getUserKeywords(userId: string): Promise<string[]> {
    try {
      const filters = await this.getUserFilters(userId)
      return filters.map(filter => filter.keyword)
    } catch (error) {
      await systemLogger.error('IntentFiltersService', 'Error in getUserKeywords', { userId, error })
      return []
    }
  }
}
