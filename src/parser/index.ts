/**
 * Main parser orchestrator for Pokemon TCG Live game logs
 */

import type {
  MatchData,
  ParseResult,
  WinCondition,
} from '../types'
import { parseSetup, isSetupError } from './setupParser'
import { parseTurns } from './eventParser'
import { splitLogIntoLines, resetEventCounter } from './utils'
import { calculateStatistics } from '../statistics'

/**
 * Parse a Pokemon TCG Live game log into structured match data
 */
export function parseLog(logText: string): ParseResult {
  // Reset event counter for consistent IDs
  resetEventCounter()

  // Validate input
  if (!logText || logText.trim().length === 0) {
    return {
      success: false,
      error: 'Please paste a game log to analyze',
    }
  }

  const lines = splitLogIntoLines(logText)

  // Check for setup phase
  if (!lines.some((line) => line === 'Setup')) {
    return {
      success: false,
      error: 'Invalid log format: missing setup phase',
    }
  }

  // Parse setup phase
  const setupResult = parseSetup(lines)
  if (isSetupError(setupResult)) {
    return {
      success: false,
      error: setupResult.error,
    }
  }

  const { players, coinFlipWinner, coinFlipChoice, events: setupEvents, pokemonInMatch: setupPokemon, setupEndIndex } = setupResult

  // Parse turns and events
  const playerNames: [string, string] = [players[0].username, players[1].username]
  const turnResult = parseTurns(lines, setupEndIndex, playerNames)

  // Validate we found turns
  if (turnResult.turns.length === 0) {
    return {
      success: false,
      error: 'Invalid log format: no game turns found',
    }
  }

  // Combine Pokemon from setup and turns
  const allPokemon = [...new Set([...setupPokemon, ...turnResult.pokemonInMatch])]

  // Combine all events
  const allEvents = [...setupEvents, ...turnResult.events]

  // Calculate statistics using the statistics module
  const statistics = calculateStatistics(allEvents, playerNames)

  // Determine winner
  let winner = turnResult.winner || 'Unknown'
  let winCondition: WinCondition = turnResult.winCondition || 'prizes'

  // If no explicit winner found, try to infer from prize cards
  if (winner === 'Unknown') {
    const p1Prizes = statistics[playerNames[0]]?.prizeCardsTaken || 0
    const p2Prizes = statistics[playerNames[1]]?.prizeCardsTaken || 0
    if (p1Prizes >= 6) {
      winner = playerNames[0]
      winCondition = 'prizes'
    } else if (p2Prizes >= 6) {
      winner = playerNames[1]
      winCondition = 'prizes'
    }
  }

  // Update turns played in statistics
  for (const turn of turnResult.turns) {
    if (statistics[turn.player]) {
      statistics[turn.player].turnsPlayed++
    }
  }

  const matchData: MatchData = {
    players,
    coinFlipWinner,
    coinFlipChoice,
    turns: turnResult.turns,
    events: allEvents,
    winner,
    winCondition,
    statistics,
    pokemonInMatch: allPokemon,
  }

  return {
    success: true,
    data: matchData,
  }
}

// Re-export utilities for external use
export { resetEventCounter } from './utils'
export { getTrainerCategory, isKnownTrainer } from './trainerCategories'
// Re-export statistics functions for convenience
export { calculateStatistics, createEmptyPlayerStats } from '../statistics'
