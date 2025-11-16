'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useChatContext } from '@/contexts/ChatContext'

/**
 * History Page - View and Restore Chat Sessions
 *
 * Architecture Reference: HW3 Section 3.1.3 Component Design
 * - Displays list of chat sessions with search
 * - Allows viewing session details
 * - Allows restoring conversations (Aurora Blue theme)
 * - Allows deleting sessions
 */

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  tokens_used?: number
}

interface ChatSession {
  session_id: string
  user_id: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { loadSession } = useChatContext()
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      fetchSessions()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/history/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch session details')
      }

      const data = await response.json()
      setSelectedSession(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete session')
      }

      await fetchSessions()
      if (selectedSession?.session_id === sessionId) {
        setSelectedSession(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const restoreSession = (session: ChatSession) => {
    // Convert messages to chat context format
    const messages = session.messages.map((msg, index) => ({
      id: `restored-${session.session_id}-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }))

    // Load session into chat context
    loadSession(session.session_id, messages)

    // Navigate to chat page
    router.push('/')
  }

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true

    const firstUserMessage = session.messages.find(msg => msg.role === 'user')
    const title = firstUserMessage?.content.toLowerCase() || ''

    return title.includes(searchQuery.toLowerCase())
  })

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div style={{ color: '#64748B' }}>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#1E293B' }}>
                Chat History
              </h1>
              <p className="mt-2" style={{ color: '#64748B' }}>
                View and restore your past conversations
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              style={{ backgroundColor: '#4A90E2' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A7BC8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A90E2'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: '#94A3B8' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none"
              style={{ border: '1px solid #CBD5E1', color: '#1E293B' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2'
                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#CBD5E1'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12" style={{ border: '3px solid #E2E8F0', borderTopColor: '#4A90E2' }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4" style={{ border: '1px solid #E2E8F0' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: '#1E293B' }}>
                    Conversations
                  </h2>
                  <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#EAF3FF', color: '#4A90E2' }}>
                    {filteredSessions.length}
                  </span>
                </div>

                {filteredSessions.length === 0 ? (
                  <div className="text-center py-12">
                    {searchQuery ? (
                      <>
                        <svg className="mx-auto h-12 w-12" style={{ color: '#CBD5E1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="mt-4" style={{ color: '#64748B' }}>No conversations found</p>
                        <p className="text-sm" style={{ color: '#94A3B8' }}>Try a different search term</p>
                      </>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12" style={{ color: '#CBD5E1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="mt-4" style={{ color: '#64748B' }}>No conversations yet</p>
                        <p className="text-sm" style={{ color: '#94A3B8' }}>Start chatting to create your first conversation</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {filteredSessions.map((session) => {
                      const firstUserMessage = session.messages.find(msg => msg.role === 'user')
                      const title = firstUserMessage
                        ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
                        : 'New Conversation'

                      const timeAgo = new Date(session.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })

                      const isSelected = selectedSession?.session_id === session.session_id

                      return (
                        <div
                          key={session.session_id}
                          className="p-4 rounded-lg cursor-pointer transition-all"
                          style={isSelected
                            ? { backgroundColor: '#EAF3FF', border: '2px solid #4A90E2' }
                            : { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }
                          }
                          onClick={() => fetchSessionDetails(session.session_id)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#CBD5E1'
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#E2E8F0'
                              e.currentTarget.style.boxShadow = 'none'
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: '#1E293B' }}>
                                {title}
                              </p>
                              <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                                {session.messages.length} messages
                              </p>
                              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                                {timeAgo}
                              </p>
                            </div>
                            {isSelected && (
                              <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#4A90E2' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Session Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #E2E8F0' }}>
                {!selectedSession ? (
                  <div className="text-center py-16">
                    <svg className="mx-auto h-16 w-16" style={{ color: '#CBD5E1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <p className="mt-4 font-medium" style={{ color: '#64748B' }}>
                      Select a conversation to view details
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                      Click on any conversation from the list
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Session Header */}
                    <div className="pb-6" style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold mb-3" style={{ color: '#1E293B' }}>
                            {selectedSession.messages.find(msg => msg.role === 'user')?.content.slice(0, 100) || 'Conversation'}
                          </h2>
                          <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#64748B' }}>
                            <span>
                              Created: {new Date(selectedSession.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span>•</span>
                            <span>{selectedSession.messages.length} messages</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => restoreSession(selectedSession)}
                          className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#4A90E2' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A7BC8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A90E2'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          Continue Conversation
                        </button>
                        <button
                          onClick={() => deleteSession(selectedSession.session_id)}
                          className="px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                      {selectedSession.messages.map((message, index) => (
                        <div key={index} className="mb-6 animate-fade-in">
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                              style={message.role === 'user'
                                ? { backgroundColor: '#4A90E2' }
                                : { backgroundColor: '#EAF3FF', border: '1px solid #D4E8FF' }
                              }
                            >
                              {message.role === 'user' ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" style={{ color: '#4A90E2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium" style={{ color: '#1E293B' }}>
                                  {message.role === 'user' ? 'You' : 'Assistant'}
                                </span>
                                <span className="text-xs" style={{ color: '#64748B' }}>
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div
                                className="text-[15px] leading-relaxed whitespace-pre-wrap rounded-lg px-4 py-3"
                                style={message.role === 'user'
                                  ? { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1E293B' }
                                  : { backgroundColor: '#F1F6FF', border: '1px solid #D4E8FF', color: '#1E293B' }
                                }
                              >
                                {message.content}
                                {message.tokens_used && (
                                  <p className="text-xs mt-2" style={{ color: '#64748B' }}>
                                    {message.tokens_used} tokens
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
