'use client'

/**
 * Login Page
 *
 * Architecture Reference: HW3 Component Diagram - Login Page
 * - User authentication page
 * - Calls Next.js API Route for login
 * - Stores JWT token in localStorage
 */

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)

      // Get redirect URL or default to home
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in" style={{ border: '1px solid #E2E8F0' }}>
          {/* Header */}
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#EAF3FF' }}>
              <svg
                className="w-8 h-8"
                style={{ color: '#4A90E2' }}
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
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1E293B' }}>Welcome Back</h1>
            <p style={{ color: '#64748B' }}>Sign in to PocketLLM</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg animate-slide-in-left" style={{ backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444' }}>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    style={{ color: '#EF4444' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm" style={{ color: '#B91C1C' }}>{error}</p>
                </div>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#1E293B' }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#1E293B',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4A90E2'
                  e.target.style.boxShadow = '0 0 0 1px #4A90E2'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#1E293B' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#1E293B',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4A90E2'
                  e.target.style.boxShadow = '0 0 0 1px #4A90E2'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white rounded-lg font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: '#4A90E2' }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#3276C7')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#4A90E2')}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F1F6FF', border: '1px solid #D4E8FF' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#1E293B' }}>Demo Credentials:</p>
              <div className="space-y-1 text-xs" style={{ color: '#475569' }}>
                <p>User: <code className="bg-white px-2 py-0.5 rounded font-mono" style={{ border: '1px solid #E2E8F0' }}>user1</code> / <code className="bg-white px-2 py-0.5 rounded font-mono" style={{ border: '1px solid #E2E8F0' }}>password123</code></p>
                <p>Admin: <code className="bg-white px-2 py-0.5 rounded font-mono" style={{ border: '1px solid #E2E8F0' }}>admin</code> / <code className="bg-white px-2 py-0.5 rounded font-mono" style={{ border: '1px solid #E2E8F0' }}>admin123</code></p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: '#64748B' }}>
          Powered by <span className="font-semibold">PocketLLM</span>
        </p>
      </div>
    </div>
  )
}
