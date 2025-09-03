import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IntentFiltersService } from '@/lib/database/intent-filters'
import { UserProfilesService } from '@/lib/database/user-profiles'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    const userProfilesService = new UserProfilesService()
    await userProfilesService.getOrCreateProfile(
      user.id, 
      user.email || '', 
      user.user_metadata?.full_name
    )

    const intentService = new IntentFiltersService()
    const filters = await intentService.getUserFilters(user.id)

    return NextResponse.json({ filters })
  } catch (error) {
    await systemLogger.error('Intent Filters API', 'Failed to fetch filters', { error })
    
    // Provide specific error message for missing table
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database setup required',
          details: error.message,
          solution: 'Please run the database migration to create the required tables.'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    const userProfilesService = new UserProfilesService()
    await userProfilesService.getOrCreateProfile(
      user.id, 
      user.email || '', 
      user.user_metadata?.full_name
    )

    const { keyword } = await request.json()
    
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keyword is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const intentService = new IntentFiltersService()
    
    // Add the filter
    const newFilter = await intentService.addFilter(user.id, keyword.trim())
    
    // Get all filters to return in response
    const allFilters = await intentService.getUserFilters(user.id)

    await systemLogger.info('Intent Filters API', 'Filter added successfully', {
      userId: user.id,
      keyword: keyword.trim(),
      filterId: newFilter.id
    })

    return NextResponse.json({ 
      success: true, 
      filter: newFilter,
      filters: allFilters,
      message: 'Filter added successfully'
    })
  } catch (error) {
    await systemLogger.error('Intent Filters API', 'Failed to add filter', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
