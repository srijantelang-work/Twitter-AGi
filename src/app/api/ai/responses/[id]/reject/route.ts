import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { systemLogger } from '@/lib/logging/system-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if response exists
    const { data: existingResponse, error: fetchError } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingResponse) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    // Update response status to rejected
    const { data: updatedResponse, error } = await supabase
      .from('ai_responses')
      .update({ 
        status: 'rejected',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      await systemLogger.error('AI Response API', 'Failed to reject response', { error, responseId: id })
      return NextResponse.json(
        { error: 'Failed to reject response' },
        { status: 500 }
      )
    }

    await systemLogger.info('AI Response API', 'Response rejected successfully', { 
      responseId: id,
      userId: user.id,
      tweetId: existingResponse.tweet_id
    })

    return NextResponse.json({
      success: true,
      response: updatedResponse
    })

  } catch (error) {
    const { id } = await params
    await systemLogger.error('AI Response API', 'Unexpected error', { error, responseId: id })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
