/**
 * DeckReconstructor service for extracting and organizing card information
 * from parsed game events to reconstruct player decks.
 */

import type {
  GameEvent,
  MatchData,
  DeckCard,
  ReconstructedDeck,
  PlayerDecks,
  CardCategory,
  TrainerSubcategory,
  EnergySubcategory,
  ConfidenceLevel,
} from '../types'
import { getTrainerCategory, isKnownTrainer } from '../parser/trainerCategories'

/**
 * Internal representation of a card during extraction
 */
interface ExtractedCard {
  name: string
  category: CardCategory
  subcategory?: TrainerSubcategory | EnergySubcategory
  count: number
  confidence: ConfidenceLevel
  evolutionStage?: number
  evolvesFrom?: string
}

/**
 * Pattern to identify basic energy cards
 */
const BASIC_ENERGY_PATTERN = /^Basic \w+ Energy$/

/**
 * Check if an energy card is a basic energy
 */
export function isBasicEnergy(energyName: string): boolean {
  return BASIC_ENERGY_PATTERN.test(energyName)
}

/**
 * Categorize a card based on its name and context
 */
export function categorizeCard(
  cardName: string,
  eventType: GameEvent['type'],
  trainerCategory?: TrainerSubcategory
): { category: CardCategory; subcategory?: TrainerSubcategory | EnergySubcategory } {
  switch (eventType) {
    case 'play_pokemon':
    case 'evolve':
      return { category: 'pokemon' }

    case 'play_trainer': {
      const subcategory = trainerCategory || getTrainerCategory(cardName)
      return { category: 'trainer', subcategory }
    }

    case 'attach_energy':
      return {
        category: 'energy',
        subcategory: isBasicEnergy(cardName) ? 'basic' : 'special',
      }

    default:
      // For draw events, we need to infer the category from the card name
      if (isBasicEnergy(cardName)) {
        return { category: 'energy', subcategory: 'basic' }
      }
      // Check for special energy patterns
      if (/Energy$/i.test(cardName)) {
        return { category: 'energy', subcategory: 'special' }
      }
      // Check if it's a known trainer (in the explicit list)
      if (isKnownTrainer(cardName)) {
        return { category: 'trainer', subcategory: getTrainerCategory(cardName) }
      }
      // Default to pokemon for unknown cards from draw events
      return { category: 'pokemon' }
  }
}

/**
 * Extract cards from game events for a specific player
 */
export function extractCardsFromEvents(
  events: GameEvent[],
  playerName: string
): Map<string, ExtractedCard> {
  const cardMap = new Map<string, ExtractedCard>()

  for (const event of events) {
    if (event.player !== playerName) continue

    try {
      switch (event.type) {
        case 'play_pokemon': {
          const pokemonName = event.details.pokemonName
          if (pokemonName) {
            addOrUpdateCard(cardMap, pokemonName, 'pokemon', undefined, 'confirmed')
          }
          break
        }

        case 'evolve': {
          const evolvedPokemon = event.details.pokemonName
          const basePokemon = event.details.evolvedFrom
          if (evolvedPokemon) {
            addOrUpdateCard(cardMap, evolvedPokemon, 'pokemon', undefined, 'confirmed', {
              evolvesFrom: basePokemon,
            })
          }
          // Also ensure the base pokemon is tracked
          if (basePokemon) {
            addOrUpdateCard(cardMap, basePokemon, 'pokemon', undefined, 'confirmed')
          }
          break
        }

        case 'play_trainer': {
          const trainerName = event.details.trainerName
          const trainerCategory = event.details.trainerCategory
          if (trainerName) {
            addOrUpdateCard(
              cardMap,
              trainerName,
              'trainer',
              trainerCategory,
              'confirmed'
            )
          }
          break
        }

        case 'attach_energy': {
          // Parse energy name from description: "Player attached EnergyName to Pokemon"
          const energyMatch = event.description.match(/attached (.+?) to/)
          if (energyMatch) {
            const energyName = energyMatch[1]
            const subcategory: EnergySubcategory = isBasicEnergy(energyName)
              ? 'basic'
              : 'special'
            addOrUpdateCard(cardMap, energyName, 'energy', subcategory, 'confirmed')
          }
          break
        }

        case 'draw': {
          // Extract revealed card names from draw events
          const cardNames = event.details.cardNames
          if (cardNames && cardNames.length > 0) {
            for (const cardName of cardNames) {
              const { category, subcategory } = categorizeCard(cardName, 'draw')
              addOrUpdateCard(cardMap, cardName, category, subcategory, 'confirmed')
            }
          }
          break
        }
      }
    } catch (error) {
      // Log error and continue processing remaining events (Requirement 7.4)
      console.warn(`Error processing event for deck reconstruction:`, error, event)
    }
  }

  return cardMap
}

/**
 * Add or update a card in the extraction map
 * Caps card counts at 4 (except for basic energy which can have unlimited copies)
 */
function addOrUpdateCard(
  cardMap: Map<string, ExtractedCard>,
  name: string,
  category: CardCategory,
  subcategory: TrainerSubcategory | EnergySubcategory | undefined,
  confidence: ConfidenceLevel,
  evolutionInfo?: { evolvesFrom?: string }
): void {
  const existing = cardMap.get(name)
  if (existing) {
    // Cap at 4 copies unless it's basic energy (unlimited in Pokemon TCG)
    const isBasicEnergyCard = category === 'energy' && subcategory === 'basic'
    const maxCount = isBasicEnergyCard ? Infinity : 4
    
    if (existing.count < maxCount) {
      existing.count++
    }
    // Keep the most specific subcategory
    if (subcategory && !existing.subcategory) {
      existing.subcategory = subcategory
    }
    // Update evolution info if provided
    if (evolutionInfo?.evolvesFrom && !existing.evolvesFrom) {
      existing.evolvesFrom = evolutionInfo.evolvesFrom
    }
  } else {
    cardMap.set(name, {
      name,
      category,
      subcategory,
      count: 1,
      confidence,
      evolvesFrom: evolutionInfo?.evolvesFrom,
    })
  }
}

/**
 * Build evolution relationships from events and assign evolution stages
 */
export function buildEvolutionRelationships(
  events: GameEvent[],
  cardMap: Map<string, ExtractedCard>
): void {
  // Build evolution chains from evolve events
  const evolutionChains = new Map<string, string>() // evolved -> base

  for (const event of events) {
    if (event.type === 'evolve') {
      const evolved = event.details.pokemonName
      const base = event.details.evolvedFrom
      if (evolved && base) {
        evolutionChains.set(evolved, base)
      }
    }
  }

  // Assign evolution stages
  for (const [cardName, card] of cardMap) {
    if (card.category !== 'pokemon') continue

    // Find the evolution stage by tracing back the chain
    let stage = 0
    let current = cardName
    while (evolutionChains.has(current)) {
      stage++
      current = evolutionChains.get(current)!
    }
    card.evolutionStage = stage

    // Set evolvesFrom if we have it
    if (evolutionChains.has(cardName)) {
      card.evolvesFrom = evolutionChains.get(cardName)
    }
  }
}

/**
 * Sort Pokemon cards by evolution line
 * Basic Pokemon come first, then Stage 1, then Stage 2
 * Within the same evolution line, they are grouped together
 */
export function sortByEvolutionLine(pokemonCards: DeckCard[]): DeckCard[] {
  // Build evolution groups
  const evolutionGroups = new Map<string, DeckCard[]>()
  const basicPokemon: DeckCard[] = []

  // First pass: identify basic Pokemon (stage 0 or no evolvesFrom)
  for (const card of pokemonCards) {
    if (card.evolutionStage === 0 || !card.evolvesFrom) {
      basicPokemon.push(card)
      evolutionGroups.set(card.name, [card])
    }
  }

  // Second pass: add evolutions to their groups
  for (const card of pokemonCards) {
    if (card.evolvesFrom) {
      // Find the root of this evolution line
      let root = card.evolvesFrom
      let foundGroup = evolutionGroups.get(root)

      // If not found directly, search for the root
      if (!foundGroup) {
        for (const [groupRoot, group] of evolutionGroups) {
          if (group.some((c) => c.name === root)) {
            foundGroup = group
            root = groupRoot
            break
          }
        }
      }

      if (foundGroup) {
        // Insert in the correct position based on evolution stage
        const insertIndex = foundGroup.findIndex(
          (c) => (c.evolutionStage ?? 0) > (card.evolutionStage ?? 0)
        )
        if (insertIndex === -1) {
          foundGroup.push(card)
        } else {
          foundGroup.splice(insertIndex, 0, card)
        }
      } else {
        // No group found, create a new one
        evolutionGroups.set(card.name, [card])
      }
    }
  }

  // Flatten groups into sorted array
  const result: DeckCard[] = []
  for (const group of evolutionGroups.values()) {
    // Sort within group by evolution stage
    group.sort((a, b) => (a.evolutionStage ?? 0) - (b.evolutionStage ?? 0))
    result.push(...group)
  }

  return result
}

/**
 * Convert extracted cards to DeckCard format
 */
function toDeckCards(cardMap: Map<string, ExtractedCard>): DeckCard[] {
  return Array.from(cardMap.values()).map((card) => ({
    name: card.name,
    category: card.category,
    subcategory: card.subcategory,
    count: card.count,
    minCount: card.count, // For now, minCount equals count
    confidence: card.confidence,
    evolutionStage: card.evolutionStage,
    evolvesFrom: card.evolvesFrom,
  }))
}

/**
 * Build a ReconstructedDeck from extracted cards
 */
function buildReconstructedDeck(
  playerName: string,
  cardMap: Map<string, ExtractedCard>
): ReconstructedDeck {
  const allCards = toDeckCards(cardMap)

  // Separate cards by category
  const pokemon = allCards.filter((c) => c.category === 'pokemon')
  const trainers = allCards.filter((c) => c.category === 'trainer')
  const energy = allCards.filter((c) => c.category === 'energy')

  // Sort Pokemon by evolution line
  const sortedPokemon = sortByEvolutionLine(pokemon)

  // Categorize trainers
  const supporters = trainers.filter((c) => c.subcategory === 'supporter')
  const items = trainers.filter((c) => c.subcategory === 'item')
  const tools = trainers.filter((c) => c.subcategory === 'tool')
  const stadiums = trainers.filter((c) => c.subcategory === 'stadium')

  // Categorize energy
  const basicEnergy = energy.filter((c) => c.subcategory === 'basic')
  const specialEnergy = energy.filter((c) => c.subcategory === 'special')

  // Calculate total cards observed
  const totalCardsObserved = allCards.reduce((sum, card) => sum + card.count, 0)

  return {
    playerName,
    cards: allCards,
    totalCardsObserved,
    pokemon: sortedPokemon,
    trainers: {
      supporters,
      items,
      tools,
      stadiums,
    },
    energy: {
      basic: basicEnergy,
      special: specialEnergy,
    },
  }
}

/**
 * Main function to reconstruct decks from match data
 */
export function reconstructDecks(matchData: MatchData): PlayerDecks {
  const playerDecks: PlayerDecks = {}

  for (const player of matchData.players) {
    try {
      const playerName = player.username

      // Extract cards from events
      const cardMap = extractCardsFromEvents(matchData.events, playerName)

      // Build evolution relationships
      buildEvolutionRelationships(matchData.events, cardMap)

      // Build the reconstructed deck
      playerDecks[playerName] = buildReconstructedDeck(playerName, cardMap)
    } catch (error) {
      // Log error and continue with other players (Requirement 7.4)
      console.warn(`Error reconstructing deck for player:`, error)
    }
  }

  return playerDecks
}
