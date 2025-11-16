'use client'

/**
 * Settings Page
 *
 * User settings page - currently supports password change.
 * - Requires authentication
 * - Validates old password before changing
 * - New password must be ≥6 characters
 */

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/settings')
    }
  }, [isAuthenticated, loading, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Frontend validation
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from old password')
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password')
      }

      // Clear form and show success message
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Password changed successfully!')
    } catch (err) {
      setError((err as Error).message || 'Failed to change password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div className="border-b bg-white" style={{ borderColor: '#E2E8F0' }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1E293B' }}>Settings</h1>
              <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
                Manage your account settings
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#F1F5F9', color: '#475569' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9'
              }}
            >
              Back to Chat
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #E2E8F0' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#1E293B' }}>
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#64748B' }}>
                Username
              </label>
              <p className="text-base font-medium" style={{ color: '#1E293B' }}>
                {user?.username}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#64748B' }}>
                Account Type
              </label>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: user?.is_admin ? '#EAF3FF' : '#F1F5F9',
                  color: user?.is_admin ? '#4A90E2' : '#64748B',
                }}
              >
                {user?.is_admin ? 'Administrator' : 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #E2E8F0' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#1E293B' }}>
            Change Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Success Message */}
            {success && (
              <div className="p-4 rounded-lg animate-slide-in-left" style={{ backgroundColor: '#F0FDF4', borderLeft: '4px solid #10B981' }}>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    style={{ color: '#10B981' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm" style={{ color: '#047857' }}>{success}</p>
                </div>
              </div>
            )}

            {/* Old Password */}
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium mb-2" style={{ color: '#1E293B' }}>
                Current Password
              </label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
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
                placeholder="Enter your current password"
                required
                disabled={isLoading}
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2" style={{ color: '#1E293B' }}>
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                placeholder="Choose a new password (min 6 characters)"
                required
                disabled={isLoading}
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#1E293B' }}>
                Confirm New Password
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
                placeholder="Confirm your new password"
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
                  <span>Changing password...</span>
                </div>
              ) : (
                <span>Change Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
