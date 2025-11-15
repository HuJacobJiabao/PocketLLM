/**
 * FetchClient - HTTP Request Wrapper
 *
 * Architecture Reference: HW3 Section 3.1.1 - Frontend Classes
 *
 * Purpose:
 * - Unified HTTP client for API calls
 * - Automatic authentication token injection
 * - Error handling and response transformation
 * - Retry logic for network failures
 *
 * Methods:
 * - get(url, options): Promise<Response>
 * - post(url, data, options): Promise<Response>
 * - put(url, data, options): Promise<Response>
 * - delete(url, options): Promise<Response>
 */

interface RequestOptions {
  headers?: Record<string, string>
  skipAuth?: boolean
  retry?: number
  timeout?: number
}

class FetchClient {
  private baseURL: string
  private defaultTimeout: number = 30000 // 30 seconds

  constructor(baseURL?: string) {
    this.baseURL = baseURL || ''
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(options?: RequestOptions): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }

    // Add authentication token if available and not skipped
    if (!options?.skipAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  /**
   * Execute fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest(
    url: string,
    init: RequestInit,
    options?: RequestOptions
  ): Promise<Response> {
    const maxRetries = options?.retry ?? 0
    const timeout = options?.timeout ?? this.defaultTimeout
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, init, timeout)
        return response
      } catch (error) {
        lastError = error as Error

        // Don't retry on last attempt
        if (attempt === maxRetries) break

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Request failed')
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const fullUrl = this.baseURL + url
    const response = await this.executeRequest(
      fullUrl,
      {
        method: 'GET',
        headers: this.buildHeaders(options),
      },
      options
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const fullUrl = this.baseURL + url
    const response = await this.executeRequest(
      fullUrl,
      {
        method: 'POST',
        headers: this.buildHeaders(options),
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const fullUrl = this.baseURL + url
    const response = await this.executeRequest(
      fullUrl,
      {
        method: 'PUT',
        headers: this.buildHeaders(options),
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const fullUrl = this.baseURL + url
    const response = await this.executeRequest(
      fullUrl,
      {
        method: 'DELETE',
        headers: this.buildHeaders(options),
      },
      options
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }
}

// Create and export default instance
export const fetchClient = new FetchClient()

// Export class for custom instances
export default FetchClient
