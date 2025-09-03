import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { systemLogger } from '@/lib/logging/system-logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if content exists and user has permission
    const { data: existingContent, error: fetchError } = await supabase
      .from('content_schedule')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (content_type !== undefined) updateData.content_type = content_type
    if (content !== undefined) updateData.content = content
    if (status !== undefined) updateData.status = status
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at
    if (title !== undefined) updateData.title = title
    if (hashtags !== undefined) updateData.hashtags = hashtags
    if (mentions !== undefined) updateData.mentions = mentions
    
    updateData.updated_at = new Date().toISOString()

    // Update content
    const { data: updatedContent, error } = await supabase
      .from('content_schedule')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      await systemLogger.error('Content Schedule API', 'Failed to update content', { error, contentId: id })
      return NextResponse.json(
        { error: 'Failed to update content' },
        { status: 500 }
      )
    }

    await systemLogger.info('Content Schedule API', 'Content updated successfully', { 
      contentId: id,
      userId: user.id,
      updates: Object.keys(updateData)
    })

    return NextResponse.json({
      success: true,
      content: updatedContent
    })

  } catch (error) {
    const { id } = await params
    await systemLogger.error('Content Schedule API', 'Unexpected error', { error, contentId: id })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if content exists
    const { data: existingContent, error: fetchError } = await supabase
      .from('content_schedule')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Delete content
    const { error } = await supabase
      .from('content_schedule')
      .delete()
      .eq('id', id)

    if (error) {
      await systemLogger.error('Content Schedule API', 'Failed to delete content', { error, contentId: id })
      return NextResponse.json(
        { error: 'Failed to delete content' },
        { status: 500 }
      )
    }

    await systemLogger.info('Content Schedule API', 'Content deleted successfully', { 
      contentId: id,
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    })

  } catch (error) {
    const { id } = await params
    await systemLogger.error('Content Schedule API', 'Unexpected error', { error, contentId: id })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
