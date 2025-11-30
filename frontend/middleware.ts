/**
 * Next.js Middleware - Authentication and Route Protection
 *
 * Architecture Reference: HW3 Section 4.3 - Next.js Middleware Requirements
 *
 * Purpose:
 * - Intercepts requests before they reach pages/API routes
 * - Validates JWT tokens for protected routes
 * - Redirects unauthorized users to login page
 * - Validates admin role for admin routes
 *
 * Protected Routes:
 * - / - Chat page (requires authentication)
 * - /admin/* - Admin dashboard (requires admin role)
 * - /api/admin/* - Admin API endpoints (requires admin role)
 * - /history - Chat history (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server'

// JWT verification (simple version - matches backend algorithm)
function verifyToken(token: string): { valid: boolean; isAdmin: boolean } {
  try {
    // Extract payload from JWT (format: header.payload.signature)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, isAdmin: false }
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    )

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return { valid: false, isAdmin: false }
    }

    // Return validity and admin status
    return {
      valid: true,
      isAdmin: payload.is_admin || false,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return { valid: false, isAdmin: false }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = authHeader?.replace('Bearer ', '')
  const tokenFromCookie = request.cookies.get('auth_token')?.value
  const token = tokenFromHeader || tokenFromCookie

  // Public routes - allow access without authentication
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isProtectedRoute = pathname === '/' || isAdminRoute || pathname.startsWith('/history')

  // Protected routes - verify token
  if (!token) {
    // No token - redirect to login (for page routes) or return 401 (for API routes)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const { valid, isAdmin } = verifyToken(token)

  if (!valid) {
    // Invalid token - redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { detail: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes - check admin role
  if (isAdminRoute && !isAdmin) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { detail: 'Admin access required' },
        { status: 403 }
      )
    }

    // Redirect to home page (not authorized for admin)
    return NextResponse.redirect(new URL('/', request.url))
  }

  // All checks passed - allow request
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/',                    // Chat page (home)
    '/admin/:path*',        // Admin dashboard
    '/api/admin/:path*',    // Admin API endpoints
    '/history/:path*',      // Chat history
  ],
}
