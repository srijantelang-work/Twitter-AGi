import { NextRequest, NextResponse } from 'next/server'
import { ContentQueueManager } from '@/lib/content/queue-manager'
import { systemLogger } from '@/lib/logging/system-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'current'

    const queueManager = new ContentQueueManager()
    const stats = await queueManager.getQueueStatistics()

    await systemLogger.info('Queue API', 'Queue statistics retrieved', {
      userId,
      stats
    })

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    await systemLogger.error('Queue API', 'Failed to get queue statistics', { error })
    
    return NextResponse.json(
      { 
        error: 'Failed to get queue statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
