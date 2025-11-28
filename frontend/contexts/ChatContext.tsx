'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'

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
  stopGenerating: () => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  setSessionId: (id: string) => void
  loadSession: (sessionId: string, messages: Message[]) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    console.log('[ChatContext] sendMessage called with:', { content, sessionId })

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const assistantMessageId = `msg-${Date.now()}`
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      const token = localStorage.getItem('auth_token')
      console.log('[ChatContext] Auth token:', token ? `${token.substring(0, 20)}...` : 'MISSING')

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: content,
          session_id: sessionId || undefined,
        }),
        signal: abortController.signal,
      })

      console.log('[ChatContext] Stream response status:', response.status)
      console.log('[ChatContext] Stream response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[ChatContext] Stream failed:', { status: response.status, body: errorText })
        throw new Error(`Failed to send message: ${response.status} ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let fullContent = ''
      let eventCount = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('[ChatContext] Stream complete. Total events:', eventCount)
          break
        }

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            eventCount++
            const dataStr = line.slice(6)
            console.log('[ChatContext] Received event:', dataStr.substring(0, 100))
            
            try {
              const data = JSON.parse(dataStr)

              if (data.type === 'start') {
                console.log('[ChatContext] Stream started:', data)
                if (data.session_id && !sessionId) {
                  setSessionId(data.session_id)
                }
              } else if (data.type === 'token') {
                fullContent += data.content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                )
              } else if (data.type === 'done') {
                console.log('[ChatContext] Stream done:', data)
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, timestamp: new Date(data.timestamp) }
                      : msg
                  )
                )
              } else if (data.type === 'error') {
                console.error('[ChatContext] Server error:', data.message)
                throw new Error(data.message)
              }
            } catch (parseError) {
              console.error('[ChatContext] Failed to parse event:', { dataStr, parseError })
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[ChatContext] Generation stopped by user')
        
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            return prev.slice(0, -1).concat({
              ...lastMessage,
              content: lastMessage.content + '\n\n[Generation stopped]',
            })
          }
          return prev
        })
      } else {
        console.error('[ChatContext] Send message error:', {
          error,
          name: error instanceof Error ? error.name : 'unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })

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
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const clearMessages = () => {
    setMessages([])
    setSessionId(null)
    stopGenerating()
  }

  const clearAllChatState = () => {
    try {
      setMessages([])
      setSessionId(null)
      try {
        localStorage.removeItem('current_session')
        localStorage.removeItem('messages')
        localStorage.removeItem('conversations')
      } catch {}
    } catch {}
  }

  useEffect(() => {
    const onAuthLogout = () => clearAllChatState()
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', onAuthLogout)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', onAuthLogout)
      }
    }
  }, [])

  const loadSession = (newSessionId: string, newMessages: Message[]) => {
    setSessionId(newSessionId)
    setMessages(newMessages)
  }

  const value: ChatContextType = {
    messages,
    sessionId,
    isLoading,
    sendMessage,
    stopGenerating,
    addMessage,
    clearMessages,
    setSessionId,
    loadSession,
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