'use client'

/**
 * AdminDashboard Component
 *
 * Architecture Reference: HW3 Class Diagram - AdminDashboard
 *
 * Purpose:
 * - Display system metrics and statistics
 * - Cache management (view stats, flush cache)
 * - Session monitoring
 * - LLM model information
 *
 * Features:
 * - Real-time metrics updates
 * - Cache flush operation
 * - Beautiful, modern UI with gradients and animations
 */

import { useState, useEffect } from 'react'
import { fetchClient } from '@/lib/fetchClient'

interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  uptime_seconds: number
}

interface CacheStats {
  hits: number
  misses: number
  total_requests: number
  hit_rate: number
  size: number
}

interface ModelInfo {
  model_loaded: boolean
  model_path: string
  n_ctx: number
  n_threads: number
  n_gpu_layers: number
  temperature: number
  top_p: number
  max_tokens: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [sessionCount, setSessionCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [flushing, setFlushing] = useState(false)
  const [currentUptime, setCurrentUptime] = useState<number>(0)

  // Fetch all admin data
  const fetchAdminData = async () => {
    try {
      const [metricsData, cacheData, modelData, sessionData] = await Promise.all([
        fetchClient.get<SystemMetrics>('/api/admin/metrics'),
        fetchClient.get<CacheStats>('/api/admin/cache/stats'),
        fetchClient.get<ModelInfo>('/api/admin/model/info'),
        fetchClient.get<{ total_sessions: number; total_users: number }>('/api/admin/sessions/count'),
      ])

      setMetrics(metricsData)
      setCacheStats(cacheData)
      setModelInfo(modelData)
      setSessionCount(sessionData.total_sessions)
      setCurrentUptime(metricsData.uptime_seconds)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle cache flush
  const handleFlushCache = async () => {
    if (!confirm('Are you sure you want to flush the cache?')) return

    setFlushing(true)
    try {
      const result = await fetchClient.post<{ message: string; items_removed: number }>(
        '/api/admin/cache/flush'
      )
      alert(`Cache flushed successfully! ${result.items_removed} items removed.`)
      // Refresh stats
      await fetchAdminData()
    } catch (error) {
      alert('Failed to flush cache: ' + (error as Error).message)
    } finally {
      setFlushing(false)
    }
  }

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAdminData()
    const interval = setInterval(fetchAdminData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  // Real-time uptime counter (updates every second)
  useEffect(() => {
    const uptimeInterval = setInterval(() => {
      setCurrentUptime((prev) => prev + 1)
    }, 1000) // Update every second
    return () => clearInterval(uptimeInterval)
  }, [])

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}h ${minutes}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor system metrics and manage resources
          </p>
        </div>
        <button
          onClick={() => fetchAdminData()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">CPU Usage</p>
              <p className="text-4xl font-bold mt-2">
                {metrics?.cpu_usage.toFixed(1) || 0}%
              </p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics?.cpu_usage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Memory Usage</p>
              <p className="text-4xl font-bold mt-2">
                {metrics?.memory_usage.toFixed(1) || 0}%
              </p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics?.memory_usage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">System Uptime</p>
              <p className="text-2xl font-bold mt-2">
                {formatUptime(currentUptime)}
              </p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-green-100 text-sm">
            Status: <span className="font-semibold">Healthy ✓</span>
          </p>
        </div>
      </div>

      {/* Cache and Sessions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cache Statistics */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cache Statistics</h3>
            <button
              onClick={handleFlushCache}
              disabled={flushing}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {flushing ? '⏳ Flushing...' : '🗑️ Flush Cache'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cache Hits</span>
              <span className="text-2xl font-bold text-green-600">
                {cacheStats?.hits || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cache Misses</span>
              <span className="text-2xl font-bold text-red-600">
                {cacheStats?.misses || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hit Rate</span>
              <span className="text-2xl font-bold text-blue-600">
                {(cacheStats?.hit_rate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Requests</span>
              <span className="text-2xl font-bold text-gray-900">
                {cacheStats?.total_requests || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>

          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-6xl font-bold" style={{ color: '#4A90E2' }}>{sessionCount}</p>
              <p className="mt-2 text-gray-600">Total Sessions</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#EAF3FF' }}>
            <p className="text-sm text-gray-700">
              💡 <span className="font-medium">Tip:</span> Sessions are persisted in SQLite database
              and will survive restarts.
            </p>
          </div>
        </div>
      </div>

      {/* LLM Model Information */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">LLM Model Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Model Status</p>
            <p className="mt-2 text-lg font-semibold">
              {modelInfo?.model_loaded ? (
                <span className="text-green-600">✓ Loaded</span>
              ) : (
                <span className="text-yellow-600">⚠ Mock Mode</span>
              )}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Model Path</p>
            <p className="mt-2 text-sm font-mono truncate" title={modelInfo?.model_path}>
              {modelInfo?.model_path.split('/').pop() || 'N/A'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Context Size</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {modelInfo?.n_ctx || 0} tokens
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">CPU Threads</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {modelInfo?.n_threads || 0} threads
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
