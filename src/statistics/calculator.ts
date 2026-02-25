/**
 * Statistics calculator for Pokemon TCG match data
 * Computes PlayerStatistics from game events
 */

import type {
  GameEvent,
  MatchStatistics,
  PlayerStatistics,
  TrainerPlayCount,
  EventDetails,
} from '../types'

/**
 * Calculate statistics from game events for all players
 */
export function calculateStatistics(
  events: GameEvent[],
  playerNames: [string, string]
): MatchStatistics {
  const stats: MatchStatistics = {}

  // Initialize stats for both players
  for (const player of playerNames) {
    stats[player] = createEmptyPlayerStats()
  }

  for (const event of events) {
    const playerStats = stats[event.player]
    if (!playerStats) continue

    switch (event.type) {
      case 'draw':
        playerStats.totalCardsDrawn += event.details.cardCount ?? 1
        break

      case 'attack':
        playerStats.totalDamageDealt += event.details.damage ?? 0
        break

      case 'knockout':
        // The player who caused the knockout gets credit
        playerStats.pokemonKnockedOut += 1
        break

      case 'prize_taken':
        playerStats.prizeCardsTaken += event.details.prizesTaken ?? 1
        break

      case 'play_trainer':
        categorizeAndCountTrainer(playerStats, event.details)
        break

      case 'coin_flip':
        playerStats.coinFlips.heads += event.details.headsCount ?? 0
        playerStats.coinFlips.tails += event.details.tailsCount ?? 0
        break
    }
  }

  return stats
}

/**
 * Create empty player statistics object
 */
export function createEmptyPlayerStats(): PlayerStatistics {
  return {
    totalDamageDealt: 0,
    totalCardsDrawn: 0,
    trainersPlayed: {
      supporters: [],
      items: [],
      tools: [],
      stadiums: [],
    },
    pokemonKnockedOut: 0,
    prizeCardsTaken: 0,
    coinFlips: {
      heads: 0,
      tails: 0,
    },
    turnsPlayed: 0,
  }
}

/**
 * Categorize and count a trainer card
 */
export function categorizeAndCountTrainer(
  stats: PlayerStatistics,
  details: EventDetails
): void {
  const trainerName = details.trainerName
  const category = details.trainerCategory

  if (!trainerName || !category) return

  const categoryKey = `${category}s` as keyof typeof stats.trainersPlayed
  const categoryList = stats.trainersPlayed[categoryKey] as TrainerPlayCount[]

  const existing = categoryList.find((t) => t.name === trainerName)
  if (existing) {
    existing.count++
  } else {
    categoryList.push({ name: trainerName, count: 1 })
  }
}

/**
 * Get total trainer cards played by a player
 */
export function getTotalTrainersPlayed(stats: PlayerStatistics): number {
  const { supporters, items, tools, stadiums } = stats.trainersPlayed
  return (
    supporters.reduce((sum, t) => sum + t.count, 0) +
    items.reduce((sum, t) => sum + t.count, 0) +
    tools.reduce((sum, t) => sum + t.count, 0) +
    stadiums.reduce((sum, t) => sum + t.count, 0)
  )
}

/**
 * Get trainer count by category
 */
export function getTrainerCountByCategory(
  stats: PlayerStatistics,
  category: 'supporters' | 'items' | 'tools' | 'stadiums'
): number {
  return stats.trainersPlayed[category].reduce((sum, t) => sum + t.count, 0)
}

/**
 * Merge statistics from multiple sources (e.g., setup + turns)
 */
export function mergeStatistics(
  base: MatchStatistics,
  additional: MatchStatistics
): MatchStatistics {
  const merged: MatchStatistics = {}

  // Get all player names from both sources
  const allPlayers = new Set([...Object.keys(base), ...Object.keys(additional)])

  for (const player of allPlayers) {
    const baseStats = base[player] || createEmptyPlayerStats()
    const additionalStats = additional[player] || createEmptyPlayerStats()

    merged[player] = {
      totalDamageDealt: baseStats.totalDamageDealt + additionalStats.totalDamageDealt,
      totalCardsDrawn: baseStats.totalCardsDrawn + additionalStats.totalCardsDrawn,
      trainersPlayed: mergeTrainersPlayed(
        baseStats.trainersPlayed,
        additionalStats.trainersPlayed
      ),
      pokemonKnockedOut: baseStats.pokemonKnockedOut + additionalStats.pokemonKnockedOut,
      prizeCardsTaken: baseStats.prizeCardsTaken + additionalStats.prizeCardsTaken,
      coinFlips: {
        heads: baseStats.coinFlips.heads + additionalStats.coinFlips.heads,
        tails: baseStats.coinFlips.tails + additionalStats.coinFlips.tails,
      },
      turnsPlayed: baseStats.turnsPlayed + additionalStats.turnsPlayed,
    }
  }

  return merged
}

/**
 * Merge trainer card counts from two sources
 */
function mergeTrainersPlayed(
  base: PlayerStatistics['trainersPlayed'],
  additional: PlayerStatistics['trainersPlayed']
): PlayerStatistics['trainersPlayed'] {
  return {
    supporters: mergeTrainerList(base.supporters, additional.supporters),
    items: mergeTrainerList(base.items, additional.items),
    tools: mergeTrainerList(base.tools, additional.tools),
    stadiums: mergeTrainerList(base.stadiums, additional.stadiums),
  }
}

/**
 * Merge two trainer count lists
 */
function mergeTrainerList(
  base: TrainerPlayCount[],
  additional: TrainerPlayCount[]
): TrainerPlayCount[] {
  const merged = new Map<string, number>()

  for (const trainer of base) {
    merged.set(trainer.name, (merged.get(trainer.name) || 0) + trainer.count)
  }

  for (const trainer of additional) {
    merged.set(trainer.name, (merged.get(trainer.name) || 0) + trainer.count)
  }

  return Array.from(merged.entries()).map(([name, count]) => ({ name, count }))
}
