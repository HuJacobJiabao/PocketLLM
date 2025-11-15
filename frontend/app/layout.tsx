import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import NavigationBar from '@/components/NavigationBar'

export const metadata: Metadata = {
  title: 'PocketLLM Portal',
  description: 'Lightweight LLM-powered conversational interface',
}

/**
 * Root Layout Component
 *
 * Architecture: Next.js App Router - Root Layout
 * - Wraps entire application with Context Providers
 * - Provides global navigation
 * - Manages global state (Auth, Chat)
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ backgroundColor: '#F9FAFB' }}>
        <AuthProvider>
          <ChatProvider>
            <div className="min-h-screen flex flex-col">
              <NavigationBar />
              <main className="flex-1 flex flex-col">
                {children}
              </main>
            </div>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
