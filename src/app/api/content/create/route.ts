import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { systemLogger } from '@/lib/logging/system-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contentType, hashtags, emojis, scheduledAt, postingTimeSlot } = body

    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'Content and content type are required' },
        { status: 400 }
      )
    }

    // Validate content length (Twitter limit)
    if (content.length > 280) {
      return NextResponse.json(
        { error: 'Content exceeds 280 character limit' },
        { status: 400 }
      )
    }

    // For now, use a default user ID - this should come from auth context
    const userId = 'default-user-id'

    const supabase = createClient()

    // Create content record
    const { data: contentRecord, error: contentError } = await supabase
      .from('ai_superconnector_content')
      .insert({
        user_id: userId,
        content_type: contentType,
        content: content.trim(),
        hashtags: hashtags || [],
        emojis: emojis || [],
        ai_generated: true,
        confidence_score: 0.9, // Default confidence for manually created content
        status: 'draft'
      })
      .select()
      .single()

    if (contentError) {
      throw contentError
    }

    // Create approval record
    const { error: approvalError } = await supabase
      .from('content_approval')
      .insert({
        content_id: contentRecord.id,
        status: 'pending'
      })

    if (approvalError) {
      // Log error but don't fail the request
      await systemLogger.warn('Content API', 'Failed to create approval record', { error: approvalError })
    }

    await systemLogger.info('Content API', 'Content created successfully', {
      contentId: contentRecord.id,
      userId,
      contentType,
      contentLength: content.length
    })

    return NextResponse.json({
      success: true,
      data: {
        id: contentRecord.id,
        content: contentRecord.content,
        contentType: contentRecord.content_type,
        status: contentRecord.status,
        createdAt: contentRecord.created_at
      },
      message: 'Content created successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Content API', 'Failed to create content', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to create content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default-user-id'
    const status = searchParams.get('status')
    const contentType = searchParams.get('contentType')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (limit > 50) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 50' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    let query = supabase
      .from('ai_superconnector_content')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    await systemLogger.info('Content API', 'Content retrieved successfully', {
      userId,
      count: data.length,
      status,
      contentType
    })

    return NextResponse.json({
      success: true,
      data: {
        content: data,
        total: data.length,
        userId,
        filters: { status, contentType }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Content API', 'Failed to retrieve content', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
