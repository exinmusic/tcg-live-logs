/**
 * DeckReconstructor service tests
 * Tests card extraction, categorization, and deck reconstruction from game events
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  reconstructDecks,
  extractCardsFromEvents,
  isBasicEnergy,
  categorizeCard,
  buildEvolutionRelationships,
  sortByEvolutionLine,
} from './deckReconstructor'
import { parseLog, resetEventCounter } from '../parser'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { GameEvent, DeckCard, MatchData } from '../types'

// Load sample log for integration testing
const sampleLog = readFileSync(join(process.cwd(), 'sample_log.txt'), 'utf-8')

describe('DeckReconstructor', () => {
  beforeEach(() => {
    resetEventCounter()
  })

  describe('isBasicEnergy', () => {
    it('should identify basic energy cards', () => {
      expect(isBasicEnergy('Basic Water Energy')).toBe(true)
      expect(isBasicEnergy('Basic Fire Energy')).toBe(true)
      expect(isBasicEnergy('Basic Grass Energy')).toBe(true)
      expect(isBasicEnergy('Basic Lightning Energy')).toBe(true)
      expect(isBasicEnergy('Basic Psychic Energy')).toBe(true)
      expect(isBasicEnergy('Basic Fighting Energy')).toBe(true)
      expect(isBasicEnergy('Basic Darkness Energy')).toBe(true)
      expect(isBasicEnergy('Basic Metal Energy')).toBe(true)
    })

    it('should reject special energy cards', () => {
      expect(isBasicEnergy('Reversal Energy')).toBe(false)
      expect(isBasicEnergy('Ignition Energy')).toBe(false)
      expect(isBasicEnergy('Double Turbo Energy')).toBe(false)
      expect(isBasicEnergy('Jet Energy')).toBe(false)
    })

    it('should reject non-energy cards', () => {
      expect(isBasicEnergy('Pikachu')).toBe(false)
      expect(isBasicEnergy('Professor Research')).toBe(false)
    })
  })

  describe('categorizeCard', () => {
    it('should categorize pokemon from play_pokemon events', () => {
      const result = categorizeCard('Pikachu', 'play_pokemon')
      expect(result.category).toBe('pokemon')
      expect(result.subcategory).toBeUndefined()
    })

    it('should categorize pokemon from evolve events', () => {
      const result = categorizeCard('Raichu', 'evolve')
      expect(result.category).toBe('pokemon')
    })

    it('should categorize trainers with provided subcategory', () => {
      const result = categorizeCard('Arven', 'play_trainer', 'supporter')
      expect(result.category).toBe('trainer')
      expect(result.subcategory).toBe('supporter')
    })

    it('should infer trainer subcategory when not provided', () => {
      const result = categorizeCard('Nest Ball', 'play_trainer')
      expect(result.category).toBe('trainer')
      expect(result.subcategory).toBe('item')
    })

    it('should categorize basic energy from attach_energy events', () => {
      const result = categorizeCard('Basic Water Energy', 'attach_energy')
      expect(result.category).toBe('energy')
      expect(result.subcategory).toBe('basic')
    })

    it('should categorize special energy from attach_energy events', () => {
      const result = categorizeCard('Reversal Energy', 'attach_energy')
      expect(result.category).toBe('energy')
      expect(result.subcategory).toBe('special')
    })
  })

  describe('extractCardsFromEvents', () => {
    it('should extract pokemon from play_pokemon events', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 0,
          player: 'Player1',
          type: 'play_pokemon',
          description: 'Player1 played Pikachu to the Active Spot',
          details: { pokemonName: 'Pikachu', location: 'active' },
          timestamp: 1,
        },
      ]

      const result = extractCardsFromEvents(events, 'Player1')
      expect(result.has('Pikachu')).toBe(true)
      expect(result.get('Pikachu')?.category).toBe('pokemon')
      expect(result.get('Pikachu')?.count).toBe(1)
      expect(result.get('Pikachu')?.confidence).toBe('confirmed')
    })

    it('should extract both pokemon from evolve events', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 1,
          player: 'Player1',
          type: 'evolve',
          description: 'Player1 evolved Pikachu to Raichu',
          details: { pokemonName: 'Raichu', evolvedFrom: 'Pikachu' },
          timestamp: 1,
        },
      ]

      const result = extractCardsFromEvents(events, 'Player1')
      expect(result.has('Raichu')).toBe(true)
      expect(result.has('Pikachu')).toBe(true)
      expect(result.get('Raichu')?.evolvesFrom).toBe('Pikachu')
    })

    it('should extract trainers from play_trainer events', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 1,
          player: 'Player1',
          type: 'play_trainer',
          description: 'Player1 played Arven',
          details: { trainerName: 'Arven', trainerCategory: 'supporter' },
          timestamp: 1,
        },
      ]

      const result = extractCardsFromEvents(events, 'Player1')
      expect(result.has('Arven')).toBe(true)
      expect(result.get('Arven')?.category).toBe('trainer')
      expect(result.get('Arven')?.subcategory).toBe('supporter')
    })

    it('should extract energy from attach_energy events', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 1,
          player: 'Player1',
          type: 'attach_energy',
          description: 'Player1 attached Basic Water Energy to Pikachu',
          details: {},
          timestamp: 1,
        },
      ]

      const result = extractCardsFromEvents(events, 'Player1')
      expect(result.has('Basic Water Energy')).toBe(true)
      expect(result.get('Basic Water Energy')?.category).toBe('energy')
      expect(result.get('Basic Water Energy')?.subcategory).toBe('basic')
    })

    it('should extract cards from draw events with revealed card names', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 1,
          player: 'Player1',
          type: 'draw',
          description: 'Player1 drew 2 cards',
          details: { cardCount: 2, cardNames: ['Nest Ball', 'Pikachu'] },
          timestamp: 1,
        },
      ]

      const result = extractCardsFromEvents(events, 'Player1')
      expect(result.has('Nest Ball')).toBe(true)
      expect(result.has('Pikachu')).toBe(true)
    })

    it('should count multiple instances of the same card', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 0,
          player: 'Player1',
          type: 'play_pokemon',
          description: 'Player1 played Pikachu to the Active Spot',
          details: { pokemonName: 'Pikachu', location: 'active' },
          timestamp: 1,
        },
        {
          id: '2',
          turn: 0,
          player: 'Player1',
          type: 'play_pokemon',
          description: 'Player1 played Pikachu to the Bench',
          details: { pokemonName: 'Pikachu', location: 'bench' },
          timestamp: 2,
        },
      ]

      const result = extractCardsFromEvents(events, 'Player1')
      expect(result.get('Pikachu')?.count).toBe(2)
    })

    it('should only extract cards for the specified player', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 0,
          player: 'Player1',
          type: 'play_pokemon',
          description: 'Player1 played Pikachu',
          details: { pokemonName: 'Pikachu' },
          timestamp: 1,
        },
        {
          id: '2',
          turn: 0,
          player: 'Player2',
          type: 'play_pokemon',
          description: 'Player2 played Charmander',
          details: { pokemonName: 'Charmander' },
          timestamp: 2,
        },
      ]

      const result = extractCardsFromEvents(events, 'Player1')
      expect(result.has('Pikachu')).toBe(true)
      expect(result.has('Charmander')).toBe(false)
    })
  })

  describe('buildEvolutionRelationships', () => {
    it('should assign evolution stages based on evolve events', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 1,
          player: 'Player1',
          type: 'evolve',
          description: 'Player1 evolved Dreepy to Drakloak',
          details: { pokemonName: 'Drakloak', evolvedFrom: 'Dreepy' },
          timestamp: 1,
        },
      ]

      // Use a type that allows evolutionStage to be added
      type ExtractedCard = {
        name: string
        category: 'pokemon' | 'trainer' | 'energy'
        count: number
        confidence: 'confirmed' | 'inferred'
        evolvesFrom?: string
        evolutionStage?: number
      }

      const cardMap = new Map<string, ExtractedCard>([
        ['Dreepy', { name: 'Dreepy', category: 'pokemon', count: 1, confidence: 'confirmed' }],
        ['Drakloak', { name: 'Drakloak', category: 'pokemon', count: 1, confidence: 'confirmed', evolvesFrom: 'Dreepy' }],
      ])

      buildEvolutionRelationships(events, cardMap)

      expect(cardMap.get('Dreepy')?.evolutionStage).toBe(0)
      expect(cardMap.get('Drakloak')?.evolutionStage).toBe(1)
    })

    it('should handle multi-stage evolution chains', () => {
      const events: GameEvent[] = [
        {
          id: '1',
          turn: 1,
          player: 'Player1',
          type: 'evolve',
          description: 'Player1 evolved Horsea to Seadra',
          details: { pokemonName: 'Seadra', evolvedFrom: 'Horsea' },
          timestamp: 1,
        },
        {
          id: '2',
          turn: 2,
          player: 'Player1',
          type: 'evolve',
          description: 'Player1 evolved Seadra to Kingdra',
          details: { pokemonName: 'Kingdra', evolvedFrom: 'Seadra' },
          timestamp: 2,
        },
      ]

      // Use a type that allows evolutionStage to be added
      type ExtractedCard = {
        name: string
        category: 'pokemon' | 'trainer' | 'energy'
        count: number
        confidence: 'confirmed' | 'inferred'
        evolvesFrom?: string
        evolutionStage?: number
      }

      const cardMap = new Map<string, ExtractedCard>([
        ['Horsea', { name: 'Horsea', category: 'pokemon', count: 1, confidence: 'confirmed' }],
        ['Seadra', { name: 'Seadra', category: 'pokemon', count: 1, confidence: 'confirmed', evolvesFrom: 'Horsea' }],
        ['Kingdra', { name: 'Kingdra', category: 'pokemon', count: 1, confidence: 'confirmed', evolvesFrom: 'Seadra' }],
      ])

      buildEvolutionRelationships(events, cardMap)

      expect(cardMap.get('Horsea')?.evolutionStage).toBe(0)
      expect(cardMap.get('Seadra')?.evolutionStage).toBe(1)
      expect(cardMap.get('Kingdra')?.evolutionStage).toBe(2)
    })
  })

  describe('sortByEvolutionLine', () => {
    it('should sort pokemon by evolution stage', () => {
      const cards: DeckCard[] = [
        { name: 'Kingdra', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 2, evolvesFrom: 'Seadra' },
        { name: 'Horsea', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 0 },
        { name: 'Seadra', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 1, evolvesFrom: 'Horsea' },
      ]

      const sorted = sortByEvolutionLine(cards)

      expect(sorted[0].name).toBe('Horsea')
      expect(sorted[1].name).toBe('Seadra')
      expect(sorted[2].name).toBe('Kingdra')
    })

    it('should group evolution lines together', () => {
      const cards: DeckCard[] = [
        { name: 'Raichu', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 1, evolvesFrom: 'Pikachu' },
        { name: 'Kingdra', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 2, evolvesFrom: 'Seadra' },
        { name: 'Pikachu', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 0 },
        { name: 'Horsea', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 0 },
        { name: 'Seadra', category: 'pokemon', count: 1, minCount: 1, confidence: 'confirmed', evolutionStage: 1, evolvesFrom: 'Horsea' },
      ]

      const sorted = sortByEvolutionLine(cards)

      // Find indices
      const pikachuIdx = sorted.findIndex(c => c.name === 'Pikachu')
      const raichuIdx = sorted.findIndex(c => c.name === 'Raichu')
      const horseaIdx = sorted.findIndex(c => c.name === 'Horsea')
      const seadraIdx = sorted.findIndex(c => c.name === 'Seadra')
      const kingdraIdx = sorted.findIndex(c => c.name === 'Kingdra')

      // Pikachu should come before Raichu
      expect(pikachuIdx).toBeLessThan(raichuIdx)
      // Horsea should come before Seadra, which should come before Kingdra
      expect(horseaIdx).toBeLessThan(seadraIdx)
      expect(seadraIdx).toBeLessThan(kingdraIdx)
    })
  })

  describe('reconstructDecks', () => {
    it('should reconstruct decks from sample log', () => {
      const parseResult = parseLog(sampleLog)
      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const decks = reconstructDecks(parseResult.data)

      // Should have decks for both players
      expect(decks['SpaghettiEd']).toBeDefined()
      expect(decks['xxXBLUESINXxx']).toBeDefined()
    })

    it('should extract Pokemon played by SpaghettiEd', () => {
      const parseResult = parseLog(sampleLog)
      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const decks = reconstructDecks(parseResult.data)
      const spaghettiDeck = decks['SpaghettiEd']

      // SpaghettiEd played Dreepy, Drakloak, Wiglett, Wugtrio
      const pokemonNames = spaghettiDeck.pokemon.map(p => p.name)
      expect(pokemonNames).toContain('Dreepy')
      expect(pokemonNames).toContain('Drakloak')
      expect(pokemonNames).toContain('Wiglett')
      expect(pokemonNames).toContain('Wugtrio')
    })

    it('should extract Pokemon played by xxXBLUESINXxx', () => {
      const parseResult = parseLog(sampleLog)
      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const decks = reconstructDecks(parseResult.data)
      const bluesDeck = decks['xxXBLUESINXxx']

      // xxXBLUESINXxx played Snorunt, Mega Froslass ex, Kyogre, Horsea, Seadra, Kingdra
      const pokemonNames = bluesDeck.pokemon.map(p => p.name)
      expect(pokemonNames).toContain('Snorunt')
      expect(pokemonNames).toContain('Mega Froslass ex')
      expect(pokemonNames).toContain('Kyogre')
      expect(pokemonNames).toContain('Horsea')
      expect(pokemonNames).toContain('Seadra')
      expect(pokemonNames).toContain('Kingdra')
    })

    it('should extract trainers with correct subcategories', () => {
      const parseResult = parseLog(sampleLog)
      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const decks = reconstructDecks(parseResult.data)
      const spaghettiDeck = decks['SpaghettiEd']

      // Check supporters
      const supporterNames = spaghettiDeck.trainers.supporters.map(t => t.name)
      expect(supporterNames).toContain('Arven')
      expect(supporterNames).toContain('Hilda')
      expect(supporterNames).toContain('Iono')

      // Check items
      const itemNames = spaghettiDeck.trainers.items.map(t => t.name)
      expect(itemNames).toContain('Nest Ball')
      expect(itemNames).toContain('Counter Catcher')
      expect(itemNames).toContain('Buddy-Buddy Poffin')
    })

    it('should extract energy with correct subcategories', () => {
      const parseResult = parseLog(sampleLog)
      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const decks = reconstructDecks(parseResult.data)
      const spaghettiDeck = decks['SpaghettiEd']

      // SpaghettiEd used Reversal Energy (special)
      const specialEnergyNames = spaghettiDeck.energy.special.map(e => e.name)
      expect(specialEnergyNames).toContain('Reversal Energy')

      // xxXBLUESINXxx used Basic Water Energy
      const bluesDeck = decks['xxXBLUESINXxx']
      const basicEnergyNames = bluesDeck.energy.basic.map(e => e.name)
      expect(basicEnergyNames).toContain('Basic Water Energy')
    })

    it('should calculate total cards observed', () => {
      const parseResult = parseLog(sampleLog)
      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const decks = reconstructDecks(parseResult.data)

      // Both players should have observed cards
      expect(decks['SpaghettiEd'].totalCardsObserved).toBeGreaterThan(0)
      expect(decks['xxXBLUESINXxx'].totalCardsObserved).toBeGreaterThan(0)
    })

    it('should mark all extracted cards as confirmed', () => {
      const parseResult = parseLog(sampleLog)
      expect(parseResult.success).toBe(true)
      if (!parseResult.success) return

      const decks = reconstructDecks(parseResult.data)

      // All cards should be confirmed since they come from actual events
      for (const card of decks['SpaghettiEd'].cards) {
        expect(card.confidence).toBe('confirmed')
      }
    })

    it('should handle empty match data gracefully', () => {
      const emptyMatchData: MatchData = {
        players: [
          { username: 'Player1', isFirst: true },
          { username: 'Player2', isFirst: false },
        ],
        coinFlipWinner: 'Player1',
        coinFlipChoice: 'first',
        turns: [],
        events: [],
        winner: 'Player1',
        winCondition: 'prizes',
        statistics: {},
        pokemonInMatch: [],
      }

      const decks = reconstructDecks(emptyMatchData)

      expect(decks['Player1']).toBeDefined()
      expect(decks['Player2']).toBeDefined()
      expect(decks['Player1'].totalCardsObserved).toBe(0)
      expect(decks['Player2'].totalCardsObserved).toBe(0)
    })
  })
})
