import type { EventType, EventDetails, TrainerCategory, WinCondition } from './events'
import type { PlayerDecks, CardFetchState } from './deck'

// Re-export event types
export type { EventType, EventDetails, TrainerCategory, WinCondition }
export * from './events'

// Re-export deck reconstruction types
export * from './deck'

/**
 * Player identification
 */
export interface Player {
  username: string
  isFirst: boolean // went first in the match
}

/**
 * Individual game event
 */
export interface GameEvent {
  id: string
  turn: number
  player: string
  type: EventType
  description: string
  details: EventDetails
  timestamp: number // relative ordering within turn
}

/**
 * Single turn container
 */
export interface Turn {
  number: number
  player: string
  events: GameEvent[]
}

/**
 * Trainer card play count
 */
export interface TrainerPlayCount {
  name: string
  count: number
}

/**
 * Player statistics
 */
export interface PlayerStatistics {
  totalDamageDealt: number
  totalCardsDrawn: number
  trainersPlayed: {
    supporters: TrainerPlayCount[]
    items: TrainerPlayCount[]
    tools: TrainerPlayCount[]
    stadiums: TrainerPlayCount[]
  }
  pokemonKnockedOut: number
  prizeCardsTaken: number
  coinFlips: {
    heads: number
    tails: number
  }
  turnsPlayed: number
}


/**
 * Aggregated statistics for all players
 */
export interface MatchStatistics {
  [playerUsername: string]: PlayerStatistics
}

/**
 * Complete match data structure
 */
export interface MatchData {
  players: [Player, Player]
  coinFlipWinner: string
  coinFlipChoice: 'first' | 'second'
  turns: Turn[]
  events: GameEvent[]
  winner: string
  winCondition: WinCondition
  statistics: MatchStatistics
  pokemonInMatch: string[]
}

/**
 * Pokemon sprite data
 */
export interface PokemonSprite {
  name: string
  spriteUrl: string | null
  isLoading: boolean
  error: string | null
}

/**
 * Application state
 */
export interface AppState {
  view: 'input' | 'results'
  rawLog: string
  matchData: MatchData | null
  sprites: Map<string, PokemonSprite>
  isLoading: boolean
  error: string | null
  deckAnalysis: {
    playerDecks: PlayerDecks | null
    cardData: Map<string, CardFetchState>
    errors: string[]
  }
  theme: 'dark' | 'light'
  crtEnabled: boolean
}

/**
 * Parser result type - either success with MatchData or error
 */
export type ParseResult =
  | { success: true; data: MatchData }
  | { success: false; error: string }

/**
 * PokeAPI response structure
 */
export interface PokeAPIResponse {
  id: number
  name: string
  sprites: {
    front_default: string | null
    other: {
      'official-artwork': {
        front_default: string | null
      }
    }
  }
}
