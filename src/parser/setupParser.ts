/**
 * Parser for the setup phase of Pokemon TCG Live game logs
 */

import type { Player, GameEvent, EventDetails } from '../types'
import { PATTERNS } from './patterns'
import {
  generateEventId,
  matchLine,
  isTurnStart,
  isSetupHeader,
  parseLocation,
} from './utils'

export interface SetupResult {
  players: [Player, Player]
  coinFlipWinner: string
  coinFlipChoice: 'first' | 'second'
  events: GameEvent[]
  pokemonInMatch: string[]
  setupEndIndex: number
}

export interface SetupError {
  error: string
}

export type SetupParseResult = SetupResult | SetupError

export function isSetupError(result: SetupParseResult): result is SetupError {
  return 'error' in result
}

/**
 * Parse the setup phase of a game log
 */
export function parseSetup(lines: string[]): SetupParseResult {
  let player1: string | null = null
  let player2: string | null = null
  let coinFlipWinner: string | null = null
  let coinFlipChoice: 'first' | 'second' | null = null
  let whoGoesFirst: string | null = null

  const events: GameEvent[] = []
  const pokemonInMatch: string[] = []
  let timestamp = 0
  let setupEndIndex = 0
  let inSetup = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for setup header
    if (isSetupHeader(line)) {
      inSetup = true
      continue
    }

    // Check for turn start - end of setup
    if (isTurnStart(line)) {
      setupEndIndex = i
      break
    }

    if (!inSetup) continue

    // Parse coin flip choice
    const coinChoiceMatch = matchLine(line, PATTERNS.coinFlipChoice)
    if (coinChoiceMatch) {
      if (!player1) player1 = coinChoiceMatch[1]
      else if (coinChoiceMatch[1] !== player1 && !player2) player2 = coinChoiceMatch[1]
      continue
    }

    // Parse coin flip winner
    const coinWinnerMatch = matchLine(line, PATTERNS.coinFlipWinner)
    if (coinWinnerMatch) {
      coinFlipWinner = coinWinnerMatch[1]
      if (!player1) player1 = coinWinnerMatch[1]
      else if (coinWinnerMatch[1] !== player1 && !player2) player2 = coinWinnerMatch[1]
      continue
    }

    // Parse go first/second decision
    const goFirstMatch = matchLine(line, PATTERNS.goFirst)
    if (goFirstMatch) {
      whoGoesFirst = goFirstMatch[1]
      coinFlipChoice = goFirstMatch[2] as 'first' | 'second'
      if (!player1) player1 = goFirstMatch[1]
      else if (goFirstMatch[1] !== player1 && !player2) player2 = goFirstMatch[1]
      continue
    }

    // Parse opening hand
    const openingHandMatch = matchLine(line, PATTERNS.openingHand)
    if (openingHandMatch) {
      const playerName = openingHandMatch[1]
      const cardCount = parseInt(openingHandMatch[2], 10)

      if (!player1) player1 = playerName
      else if (playerName !== player1 && !player2) player2 = playerName

      events.push(createDrawEvent(playerName, cardCount, 0, timestamp++))
      continue
    }

    // Parse mulligan
    const mulliganMatch = matchLine(line, PATTERNS.mulligan)
    if (mulliganMatch) {
      const playerName = mulliganMatch[1]
      events.push(createMulliganEvent(playerName, 0, timestamp++))
      continue
    }

    // Parse mulligan draw (opponent draws extra cards)
    const mulliganDrawMatch = matchLine(line, PATTERNS.mulliganDraw)
    if (mulliganDrawMatch) {
      const playerName = mulliganDrawMatch[1]
      const cardCount = parseInt(mulliganDrawMatch[2], 10)
      events.push(createDrawEvent(playerName, cardCount, 0, timestamp++))
      continue
    }

    // Parse Pokemon played to active/bench
    const playedPokemonMatch = matchLine(line, PATTERNS.playedPokemon)
    if (playedPokemonMatch) {
      const playerName = playedPokemonMatch[1]
      const pokemonName = playedPokemonMatch[2]
      const location = parseLocation(playedPokemonMatch[3])

      if (!pokemonInMatch.includes(pokemonName)) {
        pokemonInMatch.push(pokemonName)
      }

      events.push(createPlayPokemonEvent(playerName, pokemonName, location, 0, timestamp++))
      continue
    }
  }

  // Validate we found both players
  if (!player1 || !player2) {
    return { error: 'Could not identify players in the log' }
  }

  if (!coinFlipWinner) {
    return { error: 'Invalid log format: missing coin flip information' }
  }

  if (!coinFlipChoice) {
    coinFlipChoice = 'first' // Default assumption
  }

  // Determine who goes first
  const firstPlayer = whoGoesFirst || coinFlipWinner
  const isPlayer1First = firstPlayer === player1

  const players: [Player, Player] = [
    { username: player1, isFirst: isPlayer1First },
    { username: player2, isFirst: !isPlayer1First },
  ]

  return {
    players,
    coinFlipWinner,
    coinFlipChoice,
    events,
    pokemonInMatch,
    setupEndIndex,
  }
}

function createDrawEvent(
  player: string,
  cardCount: number,
  turn: number,
  timestamp: number
): GameEvent {
  const details: EventDetails = { cardCount }
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'draw',
    description: `${player} drew ${cardCount} card${cardCount !== 1 ? 's' : ''}`,
    details,
    timestamp,
  }
}

function createMulliganEvent(player: string, turn: number, timestamp: number): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'mulligan',
    description: `${player} took a mulligan`,
    details: {},
    timestamp,
  }
}

function createPlayPokemonEvent(
  player: string,
  pokemonName: string,
  location: 'active' | 'bench',
  turn: number,
  timestamp: number
): GameEvent {
  const locationText = location === 'active' ? 'Active Spot' : 'Bench'
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'play_pokemon',
    description: `${player} played ${pokemonName} to the ${locationText}`,
    details: {
      pokemonName,
      location,
    },
    timestamp,
  }
}
