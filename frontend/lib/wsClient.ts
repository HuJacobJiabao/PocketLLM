/**
 * WebSocketClient - Real-time Communication Client
 *
 * Architecture Reference: HW3 Section 3.2.2 - WebSocket Support
 *
 * Purpose:
 * - Manages WebSocket connections for real-time chat
 * - Automatic reconnection on connection loss
 * - Message queue for offline messages
 * - Event-based message handling
 *
 * Attributes:
 * - ws: WebSocket
 * - connected: boolean
 * - messageQueue: Array
 *
 * Methods:
 * - connect(url, token): Promise<void>
 * - disconnect(): void
 * - send(message): void
 * - onMessage(callback): void
 * - onError(callback): void
 */

type MessageHandler = (data: any) => void
type ErrorHandler = (error: Error) => void
type ConnectionHandler = () => void

interface WebSocketOptions {
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string = ''
  private token: string = ''
  private options: WebSocketOptions
  private reconnectAttempts: number = 0
  private messageQueue: any[] = []
  private isConnected: boolean = false
  private shouldReconnect: boolean = true

  // Event handlers
  private messageHandlers: Set<MessageHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private connectHandlers: Set<ConnectionHandler> = new Set()
  private disconnectHandlers: Set<ConnectionHandler> = new Set()

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options,
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(url: string, token?: string): Promise<void> {
    this.url = url
    this.token = token || ''
    this.shouldReconnect = true

    return new Promise((resolve, reject) => {
      try {
        // Add token to URL as query parameter
        const wsUrl = token ? `${url}?token=${token}` : url
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0

          // Send queued messages
          this.flushMessageQueue()

          // Notify connect handlers
          this.connectHandlers.forEach((handler) => handler())

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.messageHandlers.forEach((handler) => handler(data))
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event)
          const error = new Error('WebSocket connection error')
          this.errorHandlers.forEach((handler) => handler(error))
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.isConnected = false
          this.disconnectHandlers.forEach((handler) => handler())

          // Attempt reconnection if enabled
          if (this.shouldReconnect && this.options.reconnect) {
            this.attemptReconnect()
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.isConnected = false
  }

  /**
   * Send message through WebSocket
   */
  send(message: any): void {
    if (this.isConnected && this.ws) {
      try {
        const data = typeof message === 'string' ? message : JSON.stringify(message)
        this.ws.send(data)
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        // Queue message for later
        this.messageQueue.push(message)
      }
    } else {
      // Queue message if not connected
      console.warn('WebSocket not connected, queuing message')
      this.messageQueue.push(message)
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  /**
   * Register error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => {
      this.errorHandlers.delete(handler)
    }
  }

  /**
   * Register connect handler
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler)
    return () => {
      this.connectHandlers.delete(handler)
    }
  }

  /**
   * Register disconnect handler
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler)
    return () => {
      this.disconnectHandlers.delete(handler)
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    const maxAttempts = this.options.maxReconnectAttempts || 5
    if (this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnection attempts reached')
      const error = new Error('Failed to reconnect after maximum attempts')
      this.errorHandlers.forEach((handler) => handler(error))
      return
    }

    this.reconnectAttempts++
    const delay = (this.options.reconnectInterval || 3000) * this.reconnectAttempts

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${maxAttempts}) in ${delay}ms`
    )

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect(this.url, this.token).catch((error) => {
          console.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Get ready state
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }
}

// Export default instance
export const wsClient = new WebSocketClient()

// Export class for custom instances
export default WebSocketClient
