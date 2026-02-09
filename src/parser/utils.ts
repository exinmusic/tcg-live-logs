/**
 * Utility functions for log parsing
 */

import { SKIP_PATTERNS } from './patterns'

/**
 * Generate a unique ID for events
 */
let eventCounter = 0
export function generateEventId(): string {
  return `event-${++eventCounter}`
}

/**
 * Reset the event counter (useful for testing)
 */
export function resetEventCounter(): void {
  eventCounter = 0
}

/**
 * Check if a line should be skipped during parsing
 */
export function shouldSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(line))
}

/**
 * Try to match a line against a pattern and return the match or null
 */
export function matchLine(line: string, pattern: RegExp): RegExpMatchArray | null {
  return line.match(pattern)
}

/**
 * Split log text into lines, trimming whitespace
 */
export function splitLogIntoLines(logText: string): string[] {
  return logText.split('\n').map((line) => line.trimEnd())
}

/**
 * Extract Pokemon name from various formats
 * Handles names like "Mega Froslass ex", "Walking Wake ex", etc.
 */
export function extractPokemonName(text: string): string {
  return text.trim()
}

/**
 * Determine location from text
 */
export function parseLocation(locationText: string): 'active' | 'bench' {
  if (locationText.toLowerCase().includes('active')) {
    return 'active'
  }
  return 'bench'
}

/**
 * Parse a card count from text like "2 cards" or "a card"
 */
export function parseCardCount(text: string): number {
  if (text === 'a' || text === 'a card') {
    return 1
  }
  const num = parseInt(text, 10)
  return isNaN(num) ? 1 : num
}

/**
 * Check if a line indicates the start of a new turn
 */
export function isTurnStart(line: string): boolean {
  return line === "[playerName]'s Turn"
}

/**
 * Check if a line is the setup header
 */
export function isSetupHeader(line: string): boolean {
  return line === 'Setup'
}

/**
 * Extract player names from the log by finding coin flip and go first patterns
 */
export function extractPlayerNames(lines: string[]): [string, string] | null {
  let player1: string | null = null
  let player2: string | null = null

  for (const line of lines) {
    // Look for coin flip choice - this gives us one player
    const coinFlipMatch = line.match(/^(\w+) chose (heads|tails) for the opening coin flip/)
    if (coinFlipMatch && !player1) {
      player1 = coinFlipMatch[1]
    }

    // Look for coin toss winner - this gives us the other player
    const winnerMatch = line.match(/^(\w+) won the coin toss/)
    if (winnerMatch) {
      const winner = winnerMatch[1]
      if (winner !== player1) {
        player2 = winner
      } else if (!player2) {
        // Winner is same as player1, need to find player2 elsewhere
      }
    }

    // Look for "decided to go first/second" to confirm players
    const goFirstMatch = line.match(/^(\w+) decided to go (first|second)/)
    if (goFirstMatch) {
      const decider = goFirstMatch[1]
      if (!player1) player1 = decider
      else if (decider !== player1 && !player2) player2 = decider
    }

    // Look for opening hand draws to find both players
    const handMatch = line.match(/^(\w+) drew \d+ cards for the opening hand/)
    if (handMatch) {
      const drawer = handMatch[1]
      if (!player1) player1 = drawer
      else if (drawer !== player1 && !player2) player2 = drawer
    }

    if (player1 && player2) break
  }

  if (player1 && player2) {
    return [player1, player2]
  }
  return null
}
