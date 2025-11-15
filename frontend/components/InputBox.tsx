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
    <div className="p-6 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... ✨"
              className="w-full resize-none border-2 border-gray-200 rounded-2xl px-5 py-3.5 pr-12 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-gray-50 disabled:text-gray-400"
              rows={3}
              disabled={isLoading}
            />
            {value.trim() && !isLoading && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                {value.length} chars
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className={`px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300 shadow-md ${
              isLoading || !value.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-lg hover:scale-105'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono">Enter</kbd>
              <span>to send</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono">Shift+Enter</kbd>
              <span>for new line</span>
            </span>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-purple-600">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="font-medium">AI is thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
