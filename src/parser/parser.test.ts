/**
 * Parser tests for Pokemon TCG Log Visualizer
 * Tests parsing of sample_log.txt and validates core functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { parseLog, resetEventCounter } from './index'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load sample log for testing
const sampleLog = readFileSync(join(process.cwd(), 'sample_log.txt'), 'utf-8')

describe('Log Parser', () => {
  beforeEach(() => {
    resetEventCounter()
  })

  describe('parseLog with sample_log.txt', () => {
    it('should successfully parse the sample log', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
    })

    it('should extract both player usernames', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      const playerNames = result.data.players.map((p) => p.username)
      expect(playerNames).toContain('SpaghettiEd')
      expect(playerNames).toContain('xxXBLUESINXxx')
    })

    it('should identify the coin flip winner', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.coinFlipWinner).toBe('xxXBLUESINXxx')
    })

    it('should identify who goes first', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.coinFlipChoice).toBe('first')
      const firstPlayer = result.data.players.find((p) => p.isFirst)
      expect(firstPlayer?.username).toBe('xxXBLUESINXxx')
    })

    it('should parse multiple turns', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.turns.length).toBeGreaterThan(0)
    })

    it('should identify the winner', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.data.winner).toBe('SpaghettiEd')
      expect(result.data.winCondition).toBe('deck_out')
    })

    it('should extract Pokemon names from the match', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      const pokemon = result.data.pokemonInMatch
      expect(pokemon).toContain('Dreepy')
      expect(pokemon).toContain('Snorunt')
      expect(pokemon).toContain('Mega Froslass ex')
      expect(pokemon).toContain('Wugtrio')
    })

    it('should calculate statistics for both players', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      const stats = result.data.statistics
      expect(stats['SpaghettiEd']).toBeDefined()
      expect(stats['xxXBLUESINXxx']).toBeDefined()
    })

    it('should track damage dealt', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      const bluesStats = result.data.statistics['xxXBLUESINXxx']
      // xxXBLUESINXxx dealt damage with attacks: 200 + 300 + 140 + 80 + 120 = 840
      expect(bluesStats.totalDamageDealt).toBe(840)
    })

    it('should track knockouts correctly', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      const bluesStats = result.data.statistics['xxXBLUESINXxx']
      // xxXBLUESINXxx knocked out: Dreepy, Drakloak, Wugtrio, Wugtrio = 4
      expect(bluesStats.pokemonKnockedOut).toBe(4)
    })

    it('should track prize cards taken', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      const bluesStats = result.data.statistics['xxXBLUESINXxx']
      // xxXBLUESINXxx took 4 prize cards (one per knockout)
      expect(bluesStats.prizeCardsTaken).toBe(4)
    })

    it('should categorize trainer cards', () => {
      const result = parseLog(sampleLog)
      expect(result.success).toBe(true)
      if (!result.success) return

      const spaghettiStats = result.data.statistics['SpaghettiEd']
      const supporters = spaghettiStats.trainersPlayed.supporters
      const items = spaghettiStats.trainersPlayed.items

      // SpaghettiEd played supporters like Arven, Hilda, Iono
      expect(supporters.some((t) => t.name === 'Arven')).toBe(true)
      expect(supporters.some((t) => t.name === 'Hilda')).toBe(true)

      // SpaghettiEd played items like Nest Ball, Counter Catcher
      expect(items.some((t) => t.name === 'Nest Ball')).toBe(true)
    })
  })

  describe('parseLog error handling', () => {
    it('should return error for empty input', () => {
      const result = parseLog('')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toBe('Please paste a game log to analyze')
    })

    it('should return error for whitespace-only input', () => {
      const result = parseLog('   \n\t  ')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toBe('Please paste a game log to analyze')
    })

    it('should return error for log without setup phase', () => {
      const result = parseLog("Some random text\nwithout setup")
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toBe('Invalid log format: missing setup phase')
    })

    it('should return error for log without players', () => {
      const result = parseLog("Setup\n[playerName]'s Turn")
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toContain('Could not identify players')
    })
  })
})
