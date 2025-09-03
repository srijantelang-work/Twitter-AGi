import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if we can connect to Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    const status = {
      timestamp: new Date().toISOString(),
      supabase: {
        connected: !sessionError,
        error: sessionError?.message || null
      },
      tables: {} as Record<string, boolean>,
      recommendations: [] as string[]
    }

    // Check if key tables exist
    const tablesToCheck = [
      'user_profiles',
      'intent_filters', 
      'monitoring_rules',
      'system_logs',
      'twitter_oauth_connections'
    ]

    for (const tableName of tablesToCheck) {
      try {
        // Try to query the table (just count rows)
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        status.tables[tableName] = !error
      } catch (error) {
        status.tables[tableName] = false
      }
    }

    // Generate recommendations
    if (!status.supabase.connected) {
      status.recommendations.push('❌ Check Supabase connection and environment variables')
    }

    const missingTables = Object.entries(status.tables).filter(([_, exists]) => !exists)
    if (missingTables.length > 0) {
      status.recommendations.push(`❌ Missing tables: ${missingTables.map(([name]) => name).join(', ')}`)
      status.recommendations.push('💡 Run database initialization or check migrations')
    }

    if (Object.values(status.tables).every(exists => exists)) {
      status.recommendations.push('✅ All required tables exist')
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
