import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IntentFiltersService } from '@/lib/database/intent-filters'
import { systemLogger } from '@/lib/logging/system-logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: filterId } = await params
    
    if (!filterId) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      )
    }

    const intentService = new IntentFiltersService()
    
    // Remove the filter
    await intentService.removeFilter(filterId, user.id)

    await systemLogger.info('Intent Filters API', 'Filter removed successfully', {
      userId: user.id,
      filterId
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Filter removed successfully'
    })
  } catch (error) {
    await systemLogger.error('Intent Filters API', 'Failed to remove filter', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
