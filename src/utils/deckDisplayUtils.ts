/**
 * Display utility functions for Deck Reconstruction feature
 */

import type { DeckCard, ConfidenceLevel, ReconstructedDeck } from '../types/deck'

/**
 * Format card count for display
 * - Returns "Card Name x N" when count equals minCount (exact count known)
 * - Returns "Card Name (at least N)" when minCount < count (uncertain count)
 *
 * Property 3: Display Format Correctness
 * Validates: Requirements 2.3, 2.4
 */
export function formatCardCount(card: DeckCard): string {
  if (card.minCount < card.count) {
    return `${card.name} (at least ${card.minCount})`
  }
  return `${card.name} x ${card.count}`
}

/**
 * Get CSS class name based on confidence level
 * Returns distinct class names for confirmed vs inferred cards
 *
 * Property 10: Confidence Assignment and Display
 * Validates: Requirements 6.3
 */
export function getConfidenceClassName(confidence: ConfidenceLevel): string {
  return confidence === 'confirmed' ? 'card-confirmed' : 'card-inferred'
}

/**
 * Category summary for a reconstructed deck
 */
export interface CategorySummary {
  pokemon: number
  trainers: number
  energy: number
  total: number
}

/**
 * Calculate total cards per category and overall total
 *
 * Property 9: Summary Calculation Correctness
 * Validates: Requirements 5.4
 */
export function calculateDeckSummary(deck: ReconstructedDeck): CategorySummary {
  const pokemonTotal = deck.pokemon.reduce((sum, card) => sum + card.count, 0)

  const trainersTotal =
    deck.trainers.supporters.reduce((sum, card) => sum + card.count, 0) +
    deck.trainers.items.reduce((sum, card) => sum + card.count, 0) +
    deck.trainers.tools.reduce((sum, card) => sum + card.count, 0) +
    deck.trainers.stadiums.reduce((sum, card) => sum + card.count, 0)

  const energyTotal =
    deck.energy.basic.reduce((sum, card) => sum + card.count, 0) +
    deck.energy.special.reduce((sum, card) => sum + card.count, 0)

  return {
    pokemon: pokemonTotal,
    trainers: trainersTotal,
    energy: energyTotal,
    total: pokemonTotal + trainersTotal + energyTotal,
  }
}
