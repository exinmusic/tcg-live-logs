/**
 * PastGamesList Component
 * Displays previously uploaded game logs for authenticated users.
 * Only rendered when the user is authenticated.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.3, 6.5
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/useAuth'
import { logStorageService } from '../services/logStorageService'
import { LoadingSpinner } from './LoadingSpinner'
import type { GameLog } from '../types'
import './PastGamesList.css'

export interface PastGamesListProps {
  onSelectLog: (log: GameLog) => void
}

interface PastGamesState {
  logs: GameLog[]
  isLoading: boolean
  error: string | null
  selectedLogId: string | null
  isLoadingLog: boolean
  loadLogError: string | null
}

function formatTimestamp(log: GameLog): string {
  // Prefer createdAt (ISO string) for display; fall back to timestamp (unix ms)
  const date = log.createdAt
    ? new Date(log.createdAt)
    : new Date(log.timestamp)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Extract player names from the raw log content's setup section.
 * Returns "Player1 vs Player2" or falls back to "Game Log".
 */
function extractMatchLabel(log: GameLog): string {
  if (!log.content) return 'Game Log'

  const lines = log.content.split('\n').slice(0, 20)
  let player1: string | null = null
  let player2: string | null = null

  for (const line of lines) {
    const coinChoice = line.match(/^(\w+) chose (?:heads|tails) for the opening coin flip/)
    if (coinChoice) {
      const name = coinChoice[1]
      if (!player1) player1 = name
      else if (name !== player1 && !player2) player2 = name
    }

    const coinWinner = line.match(/^(\w+) won the coin toss/)
    if (coinWinner) {
      const name = coinWinner[1]
      if (!player1) player1 = name
      else if (name !== player1 && !player2) player2 = name
    }

    const goFirst = line.match(/^(\w+) decided to go (?:first|second)/)
    if (goFirst) {
      const name = goFirst[1]
      if (!player1) player1 = name
      else if (name !== player1 && !player2) player2 = name
    }

    const openingHand = line.match(/^(\w+) drew \d+ cards for the opening hand/)
    if (openingHand) {
      const name = openingHand[1]
      if (!player1) player1 = name
      else if (name !== player1 && !player2) player2 = name
    }

    if (player1 && player2) break
  }

  if (player1 && player2) return `${player1} vs ${player2}`
  return 'Game Log'
}

export function PastGamesList({ onSelectLog }: PastGamesListProps) {
  const { state: authState } = useAuth()

  const [pgState, setPgState] = useState<PastGamesState>({
    logs: [],
    isLoading: false,
    error: null,
    selectedLogId: null,
    isLoadingLog: false,
    loadLogError: null,
  })

  // Fetch logs on mount (only when authenticated)
  const fetchLogs = useCallback(async () => {
    if (!authState.tokens?.idToken) return

    setPgState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const logs = await logStorageService.getLogs(authState.tokens!.idToken)
      // Sort descending by timestamp (most recent first) – req 3.4
      const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp)
      setPgState(prev => ({ ...prev, isLoading: false, logs: sorted }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve past games.'
      setPgState(prev => ({ ...prev, isLoading: false, error: message }))
    }
  }, [authState.tokens])

  useEffect(() => {
    if (authState.isAuthenticated) {
      void fetchLogs()
    }
  }, [authState.isAuthenticated, fetchLogs])

  // Don't render when not authenticated – req 3.7
  if (!authState.isAuthenticated) return null

  const handleLogClick = async (log: GameLog) => {
    if (!authState.tokens?.idToken) return

    setPgState(prev => ({
      ...prev,
      selectedLogId: log.logId,
      isLoadingLog: true,
      loadLogError: null,
    }))

    try {
      const fullLog = await logStorageService.getLog(log.logId, authState.tokens.idToken)
      setPgState(prev => ({ ...prev, isLoadingLog: false }))
      onSelectLog(fullLog)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load game log.'
      setPgState(prev => ({
        ...prev,
        isLoadingLog: false,
        selectedLogId: null,
        loadLogError: message,
      }))
    }
  }

  return (
    <section className="past-games-list" aria-label="Past games">
      <h2 className="past-games-list__title">Past Games</h2>

      {/* Loading indicator while fetching list – req 6.5 */}
      {pgState.isLoading && (
        <LoadingSpinner size="small" message="Loading past games..." />
      )}

      {/* Error fetching list – req 6.3 */}
      {pgState.error && !pgState.isLoading && (
        <div className="past-games-list__error" role="alert">
          <span>{pgState.error}</span>
          <button
            className="past-games-list__retry-btn"
            onClick={() => void fetchLogs()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Error loading a specific log – req 6.3 */}
      {pgState.loadLogError && (
        <div className="past-games-list__error" role="alert">
          {pgState.loadLogError}
        </div>
      )}

      {/* Loading indicator while fetching a specific log – req 6.5 */}
      {pgState.isLoadingLog && (
        <LoadingSpinner size="small" message="Loading game log..." />
      )}

      {/* Empty state – req 3.6 */}
      {!pgState.isLoading && !pgState.error && pgState.logs.length === 0 && (
        <p className="past-games-list__empty">No past games available.</p>
      )}

      {/* Log list – req 3.3, 3.4 */}
      {pgState.logs.length > 0 && (
        <ul className="past-games-list__items" role="list">
          {pgState.logs.map(log => (
            <li
              key={log.logId}
              className={`past-games-list__item${pgState.selectedLogId === log.logId ? ' past-games-list__item--selected' : ''}`}
            >
              <button
                className="past-games-list__item-btn"
                onClick={() => void handleLogClick(log)}
                disabled={pgState.isLoadingLog}
                aria-pressed={pgState.selectedLogId === log.logId}
              >
                <span className="past-games-list__item-label">{extractMatchLabel(log)}</span>
                <span className="past-games-list__item-timestamp">
                  {formatTimestamp(log)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default PastGamesList
