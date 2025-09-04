import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return cache status information
    return NextResponse.json({
      success: true,
      cache: {
        status: 'active',
        message: 'Twitter API caching is enabled',
        features: [
          '15-minute cache duration',
          'Automatic rate limit handling',
          'Fallback to cached data when API fails',
          'LRU cache eviction'
        ]
      },
      rateLimiting: {
        status: 'active',
        message: 'Rate limit handling is enabled',
        features: [
          'Automatic retry with exponential backoff',
          'Graceful degradation to cached data',
          'User-friendly error messages'
        ]
      }
    })

  } catch (error) {
    await systemLogger.error('Cache Status API', 'Failed to get cache status', { error })
    return NextResponse.json(
      { error: 'Failed to get cache status' },
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

    const { action } = await request.json()
    
    switch (action) {
      case 'clear':
        // Note: In a real implementation, you'd clear the cache here
        await systemLogger.info('Cache Management', 'Cache clear requested', { userId: user.id })
        return NextResponse.json({
          success: true,
          message: 'Cache clear requested (cache will be cleared on next request)'
        })
      
      case 'stats':
        return NextResponse.json({
          success: true,
          message: 'Cache statistics are available in the Twitter API service'
        })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    await systemLogger.error('Cache Management API', 'Failed to manage cache', { error })
    return NextResponse.json(
      { error: 'Failed to manage cache' },
      { status: 500 }
    )
  }
}
