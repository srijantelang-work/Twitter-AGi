import { createClient } from '@/lib/supabase/client'
import { systemLogger } from '@/lib/logging/system-logger'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export class UserProfilesService {
  private supabase = createClient()

  /**
   * Get or create a user profile
   */
  async getOrCreateProfile(userId: string, email: string, fullName?: string): Promise<UserProfile> {
    try {
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating new user profile for:', { userId, email, fullName })
        
        const { data: newProfile, error: createError } = await this.supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: email,
            full_name: fullName || null,
            is_admin: false
          })
          .select()
          .single()

        if (createError) {
          await systemLogger.error('UserProfilesService', 'Failed to create user profile', { 
            userId, 
            email, 
            error: createError 
          })
          throw createError
        }

        await systemLogger.info('UserProfilesService', 'User profile created successfully', { 
          userId, 
          email, 
          profileId: newProfile.id 
        })

        return newProfile
      } else if (fetchError) {
        // Some other error occurred
        await systemLogger.error('UserProfilesService', 'Error fetching user profile', { 
          userId, 
          error: fetchError 
        })
        throw fetchError
      } else {
        // Profile exists, return it
        return existingProfile
      }
    } catch (error) {
      await systemLogger.error('UserProfilesService', 'Error in getOrCreateProfile', { 
        userId, 
        email, 
        error 
      })
      throw error
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist
          return null
        }
        await systemLogger.error('UserProfilesService', 'Error fetching user profile', { 
          userId, 
          error 
        })
        throw error
      }

      return data
    } catch (error) {
      await systemLogger.error('UserProfilesService', 'Error in getProfile', { 
        userId, 
        error 
      })
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'full_name' | 'is_admin'>>): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        await systemLogger.error('UserProfilesService', 'Error updating user profile', { 
          userId, 
          updates, 
          error 
        })
        throw error
      }

      await systemLogger.info('UserProfilesService', 'User profile updated successfully', { 
        userId, 
        updates 
      })

      return data
    } catch (error) {
      await systemLogger.error('UserProfilesService', 'Error in updateProfile', { 
        userId, 
        updates, 
        error 
      })
      throw error
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId)
      return profile?.is_admin || false
    } catch (error) {
      await systemLogger.error('UserProfilesService', 'Error checking admin status', { 
        userId, 
        error 
      })
      return false
    }
  }

  /**
   * Get all user profiles (admin only)
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        await systemLogger.error('UserProfilesService', 'Error fetching all profiles', { error })
        throw error
      }

      return data || []
    } catch (error) {
      await systemLogger.error('UserProfilesService', 'Error in getAllProfiles', { error })
      throw error
    }
  }
}
