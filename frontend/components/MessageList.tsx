'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/contexts/ChatContext'

/**
 * MessageList Component
 *
 * Architecture Reference: HW3 Class Diagram - MessageList
 * - Renders chat message history (Client Component)
 * - Auto-scrolls to latest message
 *
 * Attributes:
 * - messages: Array<Message>
 *
 * Methods:
 * - renderMessage(message): JSX.Element
 * - scrollToLatest(): void
 */

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToLatest()
  }, [messages])

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'

    return (
      <div
        key={message.id}
        className="mb-8 animate-fade-in"
      >
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={isUser
              ? { backgroundColor: '#4A90E2' }
              : { backgroundColor: '#EAF3FF', border: '1px solid #D4E8FF' }
            }
          >
            {isUser ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" style={{ color: '#4A90E2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium" style={{ color: '#1E293B' }}>
                {isUser ? 'You' : 'Assistant'}
              </span>
              <span className="text-xs" style={{ color: '#64748B' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div
              className="text-[15px] leading-relaxed whitespace-pre-wrap rounded-lg px-4 py-3"
              style={isUser
                ? { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1E293B' }
                : { backgroundColor: '#F1F6FF', border: '1px solid #D4E8FF', color: '#1E293B' }
              }
            >
              {message.content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 280px)' }}>
            <div className="text-center max-w-2xl">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#EAF3FF' }}>
                <svg className="w-8 h-8" style={{ color: '#4A90E2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1E293B' }}>How can I help you today?</h2>
              <p style={{ color: '#64748B' }}>Start a conversation with your AI assistant</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  )
}
