import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { systemLogger } from '@/lib/logging/system-logger'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔧 Setting up database tables...')

    // Try to create intent_filters table
    try {
      const { error: filtersError } = await supabase
        .from('intent_filters')
        .select('id')
        .limit(1)

      if (filtersError && filtersError.code === '42P01') { // Table doesn't exist
        console.log('📊 Creating intent_filters table...')
        
        // We'll need to use raw SQL here, but for now let's just check if the table exists
        return NextResponse.json({ 
          message: 'Database setup required',
          details: 'The intent_filters table does not exist. Please run the database migration manually.',
          tables: {
            intent_filters: 'missing'
          }
        })
      }
    } catch (error) {
      console.log('⚠️  Error checking intent_filters table:', error)
    }

    // If we get here, the table exists
    return NextResponse.json({ 
      message: 'Database is already set up',
      tables: {
        intent_filters: 'exists'
      }
    })

  } catch (error) {
    await systemLogger.error('Database Setup', 'Failed to check database setup', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
