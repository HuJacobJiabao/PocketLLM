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
    <nav className="bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 text-white shadow-2xl backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Icon */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300 group-hover:scale-110">
              <svg
                className="w-6 h-6"
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
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              PocketLLM Portal
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive('/')
                      ? 'bg-white bg-opacity-25 shadow-lg'
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  💬 Chat
                </Link>
                <Link
                  href="/history"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive('/history')
                      ? 'bg-white bg-opacity-25 shadow-lg'
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  📚 History
                </Link>
                {user?.is_admin && (
                  <Link
                    href="/admin"
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isActive('/admin')
                        ? 'bg-white bg-opacity-25 shadow-lg'
                        : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    ⚙️ Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white border-opacity-20">
                  <div className="flex items-center space-x-2 bg-white bg-opacity-10 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{user?.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-6 py-2 bg-white text-purple-700 hover:bg-blue-50 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
