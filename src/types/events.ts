/**
 * Event types for Pokemon TCG game actions
 */
export type EventType =
  | 'draw'
  | 'play_pokemon'
  | 'evolve'
  | 'attach_energy'
  | 'play_trainer'
  | 'use_ability'
  | 'attack'
  | 'knockout'
  | 'prize_taken'
  | 'switch'
  | 'coin_flip'
  | 'mulligan'
  | 'win'

/**
 * Trainer card categories
 */
export type TrainerCategory = 'supporter' | 'item' | 'tool' | 'stadium'

/**
 * Win condition types
 */
export type WinCondition = 'prizes' | 'deck_out' | 'no_pokemon' | 'concede'

/**
 * Event-specific details that vary by event type
 */
export interface EventDetails {
  // For attacks
  attackName?: string
  attackingPokemon?: string
  targetPokemon?: string
  damage?: number
  damageBreakdown?: string

  // For trainer cards
  trainerName?: string
  trainerCategory?: TrainerCategory

  // For Pokemon plays/evolves
  pokemonName?: string
  location?: 'active' | 'bench'
  evolvedFrom?: string

  // For draws
  cardCount?: number
  cardNames?: string[]

  // For knockouts
  knockedOutPokemon?: string
  prizesTaken?: number

  // For coin flips
  result?: 'heads' | 'tails'
  headsCount?: number
  tailsCount?: number

  // For win condition
  winCondition?: WinCondition
}
