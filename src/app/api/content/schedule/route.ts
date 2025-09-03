import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contentType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('content_schedule')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType)
    }

    const { data: content, error } = await query

    if (error) {
      await systemLogger.error('Content Schedule API', 'Failed to fetch content', { error })
      return NextResponse.json(
        { error: 'Failed to fetch content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content: content || [],
      pagination: {
        limit,
        offset,
        total: content?.length || 0
      }
    })

  } catch (error) {
    await systemLogger.error('Content Schedule API', 'Unexpected error', { error })
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
    
    const { 
      content_type, 
      title, 
      content, 
      status, 
      scheduled_at, 
      hashtags, 
      mentions 
    } = body

    // Validate required fields
    if (!content_type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type and content are required' },
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

    // Prepare content data
    const contentData: Record<string, unknown> = {
      content_type,
      content,
      status: status || 'draft',
      created_by: user.id
    }

    // Add optional fields
    if (title) contentData.title = title
    if (scheduled_at) contentData.scheduled_at = scheduled_at
    if (hashtags && Array.isArray(hashtags)) {
      contentData.hashtags = hashtags
    }
    if (mentions && Array.isArray(mentions)) {
      contentData.mentions = mentions
    }

    // If status is scheduled but no scheduled_at is provided, set it to 1 hour from now
    if (contentData.status === 'scheduled' && !contentData.scheduled_at) {
      const oneHourFromNow = new Date()
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1)
      contentData.scheduled_at = oneHourFromNow.toISOString()
    }

    // Insert new content
    const { data: newContent, error } = await supabase
      .from('content_schedule')
      .insert(contentData)
      .select()
      .single()

    if (error) {
      await systemLogger.error('Content Schedule API', 'Failed to create content', { error })
      return NextResponse.json(
        { error: 'Failed to create content' },
        { status: 500 }
      )
    }

    await systemLogger.info('Content Schedule API', 'Content created successfully', { 
      contentId: newContent.id,
      userId: user.id,
      contentType: content_type,
      status: contentData.status
    })

    return NextResponse.json({
      success: true,
      content: newContent
    })

  } catch (error) {
    await systemLogger.error('Content Schedule API', 'Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
