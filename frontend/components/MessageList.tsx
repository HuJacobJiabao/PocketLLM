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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in`}
      >
        <div className={`flex items-start space-x-3 max-w-[75%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
              isUser
                ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                : 'bg-gradient-to-br from-green-400 to-blue-400'
            }`}
          >
            {isUser ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-2xl px-5 py-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
              isUser
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1.5">
              <span className={`text-xs font-semibold ${isUser ? 'text-purple-100' : 'text-gray-500'}`}>
                {isUser ? 'You' : '🤖 Assistant'}
              </span>
              <span className={`text-xs ${isUser ? 'text-purple-200' : 'text-gray-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to PocketLLM Portal</h2>
            <p className="text-gray-600 mb-6">Start a conversation with your AI assistant</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <span className="block text-purple-600 font-semibold mb-1">💡 Ask anything</span>
                <span className="text-gray-500 text-xs">Get instant answers</span>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <span className="block text-blue-600 font-semibold mb-1">⚡ Fast responses</span>
                <span className="text-gray-500 text-xs">Powered by local LLM</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}
