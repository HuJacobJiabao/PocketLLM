'use client'

import { useState, KeyboardEvent } from 'react'

/**
 * InputBox Component with Stop Button
 *
 * Architecture Reference: HW3 Class Diagram - InputBox
 * - Chat input field component (Client Component)
 * - Handles user text input and submission
 * - Provides stop button when generating
 *
 * Attributes:
 * - value: String
 * - isLoading: boolean
 *
 * Methods:
 * - handleChange(event): void
 * - handleSubmit(event): void
 * - handleStop(): void
 * - clear(): void
 */

interface InputBoxProps {
  onSend: (content: string) => Promise<void>
  onStop: () => void
  isLoading: boolean
}

export default function InputBox({ onSend, onStop, isLoading }: InputBoxProps) {
  const [value, setValue] = useState('')

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return

    // Save the message content before clearing
    const messageContent = value.trim()
    // Clear input immediately for better UX
    clear()
    // Send the message
    await onSend(messageContent)
  }

  const handleStop = () => {
    onStop()
  }

  const clear = () => {
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div style={{ borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="relative">
          <textarea
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message PocketLLM..."
            className="w-full resize-none rounded-lg px-4 py-3 pr-12 focus:outline-none transition-all"
            style={{
              minHeight: '44px',
              maxHeight: '200px',
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
            rows={1}
            disabled={isLoading}
          />
          
          {/* Send/Stop Button */}
          {isLoading ? (
            <button
              onClick={handleStop}
              className="absolute right-2 bottom-2 p-2 rounded-md transition-colors"
              style={{ color: '#DC2626', backgroundColor: '#FEF2F2' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2'
              }}
              title="Stop generating"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-md transition-colors"
              style={
                !value.trim()
                  ? { color: '#CBD5E1', cursor: 'not-allowed' }
                  : { color: '#4A90E2' }
              }
              onMouseEnter={(e) => {
                if (value.trim()) {
                  e.currentTarget.style.backgroundColor = '#EAF3FF'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Status Text */}
        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
          <span>Press Enter to send, Shift+Enter for new line</span>
          {isLoading ? (
            <span style={{ color: '#DC2626' }}>
              Click stop button to cancel
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}