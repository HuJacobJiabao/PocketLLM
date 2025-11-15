'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

/**
 * ChatContext - Global Chat State
 *
 * Architecture Reference: HW3 Section 3.1.2 State Management
 * - React Context API for chat state
 * - Manages messages and session
 * - Provides chat operations
 */

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatContextType {
  messages: Message[]
  sessionId: string | null
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
  addMessage: (message: Message) => void
  clearMessages: () => void
  setSessionId: (id: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Create placeholder for assistant message
      const assistantMessageId = `msg-${Date.now()}`
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Call streaming endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          prompt: content,
          session_id: sessionId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'start') {
              // Update session ID
              if (data.session_id && !sessionId) {
                setSessionId(data.session_id)
              }
            } else if (data.type === 'token') {
              // Append token to message
              fullContent += data.content
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              )
            } else if (data.type === 'done') {
              // Stream complete
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, timestamp: new Date(data.timestamp) }
                    : msg
                )
              )
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error)

      // Update last message with error
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content) {
          return prev.slice(0, -1).concat({
            ...lastMessage,
            content: 'Sorry, I encountered an error. Please try again.',
          })
        }
        return prev
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const clearMessages = () => {
    setMessages([])
    setSessionId(null)
  }

  const value: ChatContextType = {
    messages,
    sessionId,
    isLoading,
    sendMessage,
    addMessage,
    clearMessages,
    setSessionId,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
