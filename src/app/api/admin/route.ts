import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserProfilesService } from '@/lib/database/user-profiles'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userService = new UserProfilesService()
    const isAdmin = await userService.isAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'users':
        const users = await userService.getAllProfiles()
        return NextResponse.json({ users })

      case 'admins':
        // Filter admin users from all profiles
        const allUsers = await userService.getAllProfiles()
        const admins = allUsers.filter(user => user.is_admin)
        return NextResponse.json({ admins })

      case 'system-stats':
        // Get system statistics
        const allUsersForStats = await userService.getAllProfiles()
        const stats = {
          total_users: allUsersForStats.length,
          admin_users: allUsersForStats.filter(user => user.is_admin).length,
          timestamp: new Date().toISOString()
        }
        return NextResponse.json({ stats })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Check if user is admin
    const userService = new UserProfilesService()
    const isAdmin = await userService.isAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create-user':
        // Note: User creation is handled by the auth system
        return NextResponse.json(
          { error: 'User creation is handled by the authentication system' },
          { status: 400 }
        )

      case 'update-user':
        const { id, ...updates } = data
        if (!id) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          )
        }
        const updatedUser = await userService.updateProfile(id, updates)
        if (!updatedUser) {
          return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 400 }
          )
        }
        return NextResponse.json({ user: updatedUser })

      case 'delete-user':
        // Note: User deletion is handled by the auth system
        return NextResponse.json(
          { error: 'User deletion is handled by the authentication system' },
          { status: 400 }
        )

      case 'promote-to-admin':
        const { id: promoteId } = data
        if (!promoteId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          )
        }
        const promoted = await userService.updateProfile(promoteId, { is_admin: true })
        if (!promoted) {
          return NextResponse.json(
            { error: 'Failed to promote user to admin' },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true })

      case 'demote-from-admin':
        const { id: demoteId } = data
        if (!demoteId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          )
        }
        const demoted = await userService.updateProfile(demoteId, { is_admin: false })
        if (!demoted) {
          return NextResponse.json(
            { error: 'Failed to demote user from admin' },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
