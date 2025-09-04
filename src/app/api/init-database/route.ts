import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserProfilesService } from '@/lib/database/user-profiles'
import { systemLogger } from '@/lib/logging/system-logger'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userProfilesService = new UserProfilesService()
    
    // Ensure user profile exists
    const profile = await userProfilesService.getOrCreateProfile(
      user.id, 
      user.email || '', 
      user.user_metadata?.full_name
    )

    await systemLogger.info('Database Init', 'User profile ensured', {
      userId: user.id,
      email: user.email,
      profileId: profile.id
    })

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      user: {
        id: user.id,
        email: user.email,
        profile: profile
      }
    })

  } catch (error) {
    await systemLogger.error('Database Init', 'Failed to initialize database', { error })
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}
