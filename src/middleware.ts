import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check if user is authenticated for protected routes
  const { pathname } = request.nextUrl
  const protectedRoutes = ['/dashboard', '/admin', '/surveys']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // FIXED: Skip middleware for auth callback routes and Twitter OAuth routes
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/auth/twitter')) {
    return supabaseResponse
  }



  if (isProtectedRoute) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('Middleware: Unauthenticated user accessing protected route', { pathname })
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      
      // FIXED: Log successful authentication for Twitter OAuth users
      if (user.email?.includes('@twitter.oauth')) {
        console.log('Middleware: Twitter OAuth user accessing protected route', { 
          userId: user.id, 
          pathname 
        })
      }
      
    } catch (error) {
      console.error('Auth error in middleware:', error)
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
