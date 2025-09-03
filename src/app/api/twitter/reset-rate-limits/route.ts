import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TwitterRateLimiter } from '@/lib/rate-limit/twitter-rate-limiter'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reset rate limits
    const rateLimiter = new TwitterRateLimiter()
    rateLimiter.resetAllLimits()

    return NextResponse.json({
      success: true,
      message: 'Rate limits reset successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Failed to reset rate limits',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
