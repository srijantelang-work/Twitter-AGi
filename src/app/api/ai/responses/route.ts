import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserProfilesService } from '@/lib/database/user-profiles'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('ai_responses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type && type !== 'all') {
      query = query.eq('response_type', type)
    }

    if (search) {
      query = query.or(`content.ilike.%${search}%,tweet_id.ilike.%${search}%`)
    }

    const { data: responses, error } = await query

    if (error) {
      await systemLogger.error('AI Responses API', 'Failed to fetch responses', { error })
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      responses: responses || [],
      pagination: {
        limit,
        offset,
        total: responses?.length || 0
      }
    })

  } catch (error) {
    await systemLogger.error('AI Responses API', 'Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { tweet_id, response_type, content, ai_generated, confidence_score, status } = body

    // Validate required fields
    if (!tweet_id || !response_type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Insert new response
    const { data: response, error } = await supabase
      .from('ai_responses')
      .insert({
        tweet_id,
        response_type,
        content,
        ai_generated: ai_generated ?? true,
        confidence_score: confidence_score ?? 0.8,
        status: status ?? 'pending',
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      await systemLogger.error('AI Responses API', 'Failed to create response', { error })
      return NextResponse.json(
        { error: 'Failed to create response' },
        { status: 500 }
      )
    }

    await systemLogger.info('AI Responses API', 'Response created successfully', { 
      responseId: response.id,
      userId: user.id 
    })

    return NextResponse.json({
      success: true,
      response
    })

  } catch (error) {
    await systemLogger.error('AI Responses API', 'Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
