'use client'

import { useState, KeyboardEvent } from 'react'

/**
 * InputBox Component
 *
 * Architecture Reference: HW3 Class Diagram - InputBox
 * - Chat input field component (Client Component)
 * - Handles user text input and submission
 *
 * Attributes:
 * - value: String
 * - isLoading: boolean
 *
 * Methods:
 * - handleChange(event): void
 * - handleSubmit(event): void
 * - clear(): void
 */

interface InputBoxProps {
  onSend: (content: string) => Promise<void>
  isLoading: boolean
}

export default function InputBox({ onSend, isLoading }: InputBoxProps) {
  const [value, setValue] = useState('')

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return

    await onSend(value)
    clear()
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
          <button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className="absolute right-2 bottom-2 p-2 rounded-md transition-colors"
            style={
              isLoading || !value.trim()
                ? { color: '#CBD5E1', cursor: 'not-allowed' }
                : { color: '#4A90E2' }
            }
            onMouseEnter={(e) => {
              if (!isLoading && value.trim()) {
                e.currentTarget.style.backgroundColor = '#EAF3FF'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid #CBD5E1', borderTopColor: '#4A90E2' }}></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
          <span>Press Enter to send, Shift+Enter for new line</span>
          {isLoading && <span style={{ color: '#4A90E2' }}>Generating response...</span>}
        </div>
      </div>
    </div>
  )
}
