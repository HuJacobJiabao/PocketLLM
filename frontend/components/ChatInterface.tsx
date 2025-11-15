'use client'

import { useChat } from '@/hooks/useChat'
import MessageList from './MessageList'
import InputBox from './InputBox'

/**
 * ChatInterface Component
 *
 * Architecture Reference: HW3 Class Diagram - ChatInterface
 * - Main chat UI component (Client Component)
 * - Contains MessageList and InputBox
 * - Uses useChat hook for state management
 *
 * Attributes:
 * - messages: Array<Message>
 * - inputRef: Ref
 *
 * Methods:
 * - sendMessage(text): void
 * - updateMessages(message): void
 * - scrollToBottom(): void
 */

export default function ChatInterface() {
  const { messages, sendMessage, isLoading, clearMessages } = useChat()

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  const handleNewSession = () => {
    if (messages.length > 0) {
      if (confirm('Start a new chat session? Current conversation will be saved to history.')) {
        clearMessages()
      }
    } else {
      clearMessages()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Session button */}
      {messages.length > 0 && (
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <button
            onClick={handleNewSession}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>
      )}

      {/* Message Display Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <InputBox onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
