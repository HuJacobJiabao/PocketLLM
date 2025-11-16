'use client'

/**
 * Register Page
 *
 * User registration page with Aurora Blue theme.
 * - Creates new user account
 * - Auto-login after successful registration
 * - Validates username (≥3 chars) and password (≥6 chars)
 */

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Frontend validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters long')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed')
      }

      // Store token and user info (auto-login)
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user', JSON.stringify({
        id: data.user_id,
        username: data.username,
        is_admin: data.is_admin,
      }))

      // Redirect to home page
      router.push('/')
    } catch (err) {
      setError((err as Error).message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Register Card */}
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1E293B' }}>Create Account</h1>
            <p style={{ color: '#64748B' }}>Join PocketLLM today</p>
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
                placeholder="Choose a username (min 3 characters)"
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
                placeholder="Choose a password (min 6 characters)"
                required
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#1E293B' }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                placeholder="Confirm your password"
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
                  <span>Creating account...</span>
                </div>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: '#64748B' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: '#4A90E2' }}>
                  Sign in
                </Link>
              </p>
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
