/**
 * Types for Deck Reconstruction feature
 */

/**
 * Confidence level for card presence in deck
 * - confirmed: Card was directly played or revealed in the log
 * - inferred: Card's presence is deduced from game mechanics
 */
export type ConfidenceLevel = 'confirmed' | 'inferred'

/**
 * Card category for grouping
 */
export type CardCategory = 'pokemon' | 'trainer' | 'energy'

/**
 * Trainer subcategory
 */
export type TrainerSubcategory = 'supporter' | 'item' | 'tool' | 'stadium'

/**
 * Energy subcategory
 */
export type EnergySubcategory = 'basic' | 'special'

/**
 * A card entry in a reconstructed deck
 */
export interface DeckCard {
  name: string
  category: CardCategory
  subcategory?: TrainerSubcategory | EnergySubcategory
  count: number
  minCount: number // For uncertain counts, minCount <= count
  confidence: ConfidenceLevel
  evolutionStage?: number // 0 = basic, 1 = stage 1, 2 = stage 2
  evolvesFrom?: string // Name of pre-evolution
}

/**
 * Reconstructed deck for a single player
 */
export interface ReconstructedDeck {
  playerName: string
  cards: DeckCard[]
  totalCardsObserved: number
  pokemon: DeckCard[]
  trainers: {
    supporters: DeckCard[]
    items: DeckCard[]
    tools: DeckCard[]
    stadiums: DeckCard[]
  }
  energy: {
    basic: DeckCard[]
    special: DeckCard[]
  }
}

/**
 * Decks for both players
 */
export interface PlayerDecks {
  [playerName: string]: ReconstructedDeck
}

/**
 * Card data from Pokemon TCG API
 */
export interface CardData {
  id: string
  name: string
  supertype: string // 'Pokémon', 'Trainer', 'Energy'
  subtypes?: string[] // ['Basic', 'Stage 1'], ['Supporter'], etc.
  imageUrl: string
  imageUrlHiRes: string
  setName: string
  setReleaseDate: string
  isPlaceholder: boolean
}

/**
 * Card fetch result with loading state
 */
export interface CardFetchState {
  data: CardData | null
  isLoading: boolean
  error: string | null
}
