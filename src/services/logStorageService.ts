/**
 * LogStorageService
 * Client-side service for storing and retrieving game logs via the backend API.
 */

import type { GameLog } from '../types'
import { fromHttpStatus, categorizeError } from './errorService'
import { fetchWithRetry } from './retryUtils'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

// ---------------------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------------------

function handleResponse(res: Response): Response {
  if (res.ok) return res
  throw fromHttpStatus(res.status)
}

// ---------------------------------------------------------------------------
// LogStorageService class
// ---------------------------------------------------------------------------

export class LogStorageService {
  private readonly baseUrl: string
  private readonly onRetry?: (attempt: number, delayMs: number, error: unknown) => void

  constructor(
    baseUrl: string = API_URL,
    onRetry?: (attempt: number, delayMs: number, error: unknown) => void,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.onRetry = onRetry
  }

  /**
   * Store a game log for the authenticated user.
   * POST /logs
   */
  async storeLog(
    content: string,
    token: string,
  ): Promise<{ logId: string; timestamp: number }> {
    let res: Response
    try {
      res = await fetchWithRetry(
        `${this.baseUrl}/logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        },
        { onRetry: this.onRetry },
      )
    } catch (err) {
      throw categorizeError(err)
    }

    handleResponse(res)
    const data = (await res.json()) as { logId: string; timestamp: number }
    return { logId: data.logId, timestamp: data.timestamp }
  }

  /**
   * Retrieve all game logs for the authenticated user.
   * GET /logs
   */
  async getLogs(token: string): Promise<GameLog[]> {
    let res: Response
    try {
      res = await fetchWithRetry(
        `${this.baseUrl}/logs`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        { onRetry: this.onRetry },
      )
    } catch (err) {
      throw categorizeError(err)
    }

    handleResponse(res)
    const data = (await res.json()) as { logs: GameLog[] } | GameLog[]
    return Array.isArray(data) ? data : data.logs
  }

  /**
   * Retrieve a specific game log by ID.
   * GET /logs/{logId}
   */
  async getLog(logId: string, token: string): Promise<GameLog> {
    let res: Response
    try {
      res = await fetchWithRetry(
        `${this.baseUrl}/logs/${encodeURIComponent(logId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        { onRetry: this.onRetry },
      )
    } catch (err) {
      throw categorizeError(err)
    }

    if (!res.ok) {
      throw fromHttpStatus(res.status, res.status === 404 ? 'Log not found.' : undefined)
    }

    return res.json() as Promise<GameLog>
  }
}

// Singleton instance
export const logStorageService = new LogStorageService()
