'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'

/**
 * NavigationBar Component
 *
 * Architecture Reference: HW3 Component Diagram - Navigation Bar
 * - Global navigation component
 * - Shows auth status and navigation links
 * - Part of Root Layout
 */

export default function NavigationBar() {
  const { isAuthenticated, user, logout } = useAuth()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }} className="shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div style={{ backgroundColor: '#4A90E2' }} className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold" style={{ color: '#1E293B' }}>
              PocketLLM
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={isActive('/') ? { backgroundColor: '#EAF3FF', color: '#1E293B' } : { color: '#475569' }}
                  onMouseEnter={(e) => !isActive('/') && (e.currentTarget.style.backgroundColor = '#F2F4F7')}
                  onMouseLeave={(e) => !isActive('/') && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Chat
                </Link>
                <Link
                  href="/history"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={isActive('/history') ? { backgroundColor: '#EAF3FF', color: '#1E293B' } : { color: '#475569' }}
                  onMouseEnter={(e) => !isActive('/history') && (e.currentTarget.style.backgroundColor = '#F2F4F7')}
                  onMouseLeave={(e) => !isActive('/history') && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  History
                </Link>
                {user?.is_admin && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    style={isActive('/admin') ? { backgroundColor: '#EAF3FF', color: '#1E293B' } : { color: '#475569' }}
                    onMouseEnter={(e) => !isActive('/admin') && (e.currentTarget.style.backgroundColor = '#F2F4F7')}
                    onMouseLeave={(e) => !isActive('/admin') && (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3 ml-6 pl-6" style={{ borderLeft: '1px solid #E2E8F0' }}>
                  <span className="text-sm" style={{ color: '#475569' }}>{user?.username}</span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                    style={{ color: '#475569', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F2F4F7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                style={{ backgroundColor: '#4A90E2' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3276C7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A90E2'}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
