/**
 * Parser for turn-by-turn events in Pokemon TCG Live game logs
 */

import type { GameEvent, Turn, EventDetails, WinCondition, Player } from '../types'
import { PATTERNS } from './patterns'
import { getTrainerCategory } from './trainerCategories'
import {
  generateEventId,
  matchLine,
  isTurnStart,
  shouldSkipLine,
  parseLocation,
} from './utils'

export interface TurnParseResult {
  turns: Turn[]
  events: GameEvent[]
  pokemonInMatch: string[]
  winner: string | null
  winCondition: WinCondition | null
}

/**
 * Parse all turns and events from the game log starting after setup
 */
export function parseTurns(
  lines: string[],
  startIndex: number,
  players: [Player, Player]
): TurnParseResult {
  const turns: Turn[] = []
  const allEvents: GameEvent[] = []
  const pokemonInMatch: string[] = []
  let winner: string | null = null
  let winCondition: WinCondition | null = null

  let currentTurn: Turn | null = null
  let turnNumber = 0
  let timestamp = 0
  
  // Determine which player goes first
  const firstPlayer = players.find(p => p.isFirst) || players[0]
  const secondPlayer = players.find(p => !p.isFirst) || players[1]
  const orderedPlayers = [firstPlayer.username, secondPlayer.username]
  
  let currentPlayer = orderedPlayers[0]
  let lastDamageBreakdown: string | null = null

  // Track which player's turn it is by alternating
  let turnPlayerIndex = 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]

    // Check for turn start
    if (isTurnStart(line)) {
      // Save previous turn if exists
      if (currentTurn && currentTurn.events.length > 0) {
        turns.push(currentTurn)
      }

      turnNumber++
      // Alternate between players
      currentPlayer = orderedPlayers[turnPlayerIndex % 2]
      turnPlayerIndex++

      currentTurn = {
        number: turnNumber,
        player: currentPlayer,
        events: [],
      }
      timestamp = 0
      continue
    }

    // Skip metadata lines
    if (shouldSkipLine(line)) {
      // Check for damage breakdown to capture it
      if (line.startsWith('- Damage breakdown:') || line.startsWith('   •')) {
        if (line.includes('damage')) {
          lastDamageBreakdown = line.replace('   • ', '').trim()
        }
      }
      continue
    }

    if (!currentTurn) continue

    // Parse various event types
    let event: GameEvent | null = null

    // Check for win conditions first
    const deckOutMatch = matchLine(line, PATTERNS.deckOut)
    if (deckOutMatch) {
      winner = deckOutMatch[1]
      winCondition = 'deck_out'
      event = createWinEvent(winner, winCondition, turnNumber, timestamp++)
    }

    const prizeWinMatch = matchLine(line, PATTERNS.prizeWin)
    if (!event && prizeWinMatch) {
      winner = prizeWinMatch[1]
      winCondition = 'prizes'
      event = createWinEvent(winner, winCondition, turnNumber, timestamp++)
    }

    // Parse attack
    const attackMatch = matchLine(line, PATTERNS.attack)
    if (!event && attackMatch) {
      const attacker = attackMatch[1]
      const attackingPokemon = attackMatch[2]
      const attackName = attackMatch[3]
      // attackMatch[4] is the target player (captured but not used)
      const targetPokemon = attackMatch[5]
      const damage = parseInt(attackMatch[6], 10)

      addPokemonIfNew(pokemonInMatch, attackingPokemon)
      addPokemonIfNew(pokemonInMatch, targetPokemon)

      event = createAttackEvent(
        attacker,
        attackingPokemon,
        attackName,
        targetPokemon,
        damage,
        lastDamageBreakdown,
        turnNumber,
        timestamp++
      )
      lastDamageBreakdown = null
    }

    // Parse knockout
    const knockoutMatch = matchLine(line, PATTERNS.knockout)
    if (!event && knockoutMatch) {
      const knockedOutPlayer = knockoutMatch[1]
      const knockedOutPokemon = knockoutMatch[2]
      // The OTHER player caused the knockout
      const causingPlayer = orderedPlayers.find((p) => p !== knockedOutPlayer) || currentPlayer

      event = createKnockoutEvent(
        causingPlayer,
        knockedOutPokemon,
        turnNumber,
        timestamp++
      )
    }

    // Parse prize taken
    const prizeTakenMatch = matchLine(line, PATTERNS.prizeTaken)
    if (!event && prizeTakenMatch) {
      const prizeTaker = prizeTakenMatch[1]
      event = createPrizeTakenEvent(prizeTaker, turnNumber, timestamp++)
    }

    // Parse switch
    const switchMatch = matchLine(line, PATTERNS.switchedIn)
    if (!event && switchMatch) {
      const switchPlayer = switchMatch[1]
      const switchedPokemon = switchMatch[2]
      addPokemonIfNew(pokemonInMatch, switchedPokemon)
      event = createSwitchEvent(switchPlayer, switchedPokemon, turnNumber, timestamp++)
    }

    // Parse ability use
    const abilityMatch = matchLine(line, PATTERNS.usedAbility)
    if (!event && abilityMatch) {
      const abilityPlayer = abilityMatch[1]
      const abilityPokemon = abilityMatch[2]
      const abilityName = abilityMatch[3]
      addPokemonIfNew(pokemonInMatch, abilityPokemon)
      event = createAbilityEvent(
        abilityPlayer,
        abilityPokemon,
        abilityName,
        turnNumber,
        timestamp++
      )
    }

    // Parse evolution
    const evolveMatch = matchLine(line, PATTERNS.evolved)
    if (!event && evolveMatch) {
      const evolvePlayer = evolveMatch[1]
      const fromPokemon = evolveMatch[2]
      const toPokemon = evolveMatch[3]
      addPokemonIfNew(pokemonInMatch, fromPokemon)
      addPokemonIfNew(pokemonInMatch, toPokemon)
      event = createEvolveEvent(
        evolvePlayer,
        fromPokemon,
        toPokemon,
        turnNumber,
        timestamp++
      )
    }

    // Parse stadium played
    const stadiumMatch = matchLine(line, PATTERNS.playedStadium)
    if (!event && stadiumMatch) {
      const stadiumPlayer = stadiumMatch[1]
      const stadiumName = stadiumMatch[2]
      event = createTrainerEvent(
        stadiumPlayer,
        stadiumName,
        'stadium',
        turnNumber,
        timestamp++
      )
    }

    // Parse Pokemon played (must come before trainer check to avoid false matches)
    const playPokemonMatch = matchLine(line, PATTERNS.playedPokemon)
    if (!event && playPokemonMatch) {
      const playPlayer = playPokemonMatch[1]
      const pokemonName = playPokemonMatch[2]
      const location = parseLocation(playPokemonMatch[3])
      addPokemonIfNew(pokemonInMatch, pokemonName)
      event = createPlayPokemonEvent(
        playPlayer,
        pokemonName,
        location,
        turnNumber,
        timestamp++
      )
    }

    // Parse trainer played (must come after stadium and Pokemon checks)
    const trainerMatch = matchLine(line, PATTERNS.playedTrainer)
    if (!event && trainerMatch) {
      const trainerPlayer = trainerMatch[1]
      const trainerName = trainerMatch[2].trim()
      const category = getTrainerCategory(trainerName)
      event = createTrainerEvent(
        trainerPlayer,
        trainerName,
        category,
        turnNumber,
        timestamp++
      )
    }

    // Parse energy attachment
    const energyMatch = matchLine(line, PATTERNS.attachedEnergy)
    if (!event && energyMatch) {
      const energyPlayer = energyMatch[1]
      const energyName = energyMatch[2]
      const targetPokemon = energyMatch[3]

      // Check if this is a tool attachment (Gravity Gemstone, Air Balloon, etc.)
      const toolCategory = getTrainerCategory(energyName)
      if (toolCategory === 'tool') {
        event = createTrainerEvent(
          energyPlayer,
          energyName,
          'tool',
          turnNumber,
          timestamp++
        )
      } else {
        addPokemonIfNew(pokemonInMatch, targetPokemon)
        event = createEnergyEvent(
          energyPlayer,
          energyName,
          targetPokemon,
          turnNumber,
          timestamp++
        )
      }
    }

    // Parse draw (single card)
    const drewCardMatch = matchLine(line, PATTERNS.drewCard)
    if (!event && drewCardMatch) {
      const drawPlayer = drewCardMatch[1]
      const cardName = drewCardMatch[2]
      // Skip if it's a "drew X and played" pattern (handled by trainer effects)
      if (!cardName.includes(' and played')) {
        event = createDrawEvent(drawPlayer, 1, [cardName], turnNumber, timestamp++)
      }
    }

    // Parse draw (multiple cards)
    const drewCardsMatch = matchLine(line, PATTERNS.drewCards)
    if (!event && drewCardsMatch) {
      const drawPlayer = drewCardsMatch[1]
      const cardCount = parseInt(drewCardsMatch[2], 10)
      
      // Look ahead for bullet points with card names
      const cardNames = lookAheadForCardNames(lines, i)
      
      event = createDrawEvent(drawPlayer, cardCount, cardNames, turnNumber, timestamp++)
    }

    // Parse coin flip
    const coinFlipMatch = matchLine(line, PATTERNS.coinFlip)
    if (!event && coinFlipMatch) {
      const totalFlips = parseInt(coinFlipMatch[1], 10)
      const headsCount = parseInt(coinFlipMatch[2], 10)
      const tailsCount = totalFlips - headsCount
      event = createCoinFlipEvent(
        currentPlayer,
        headsCount,
        tailsCount,
        turnNumber,
        timestamp++
      )
    }

    if (event) {
      currentTurn.events.push(event)
      allEvents.push(event)
    }
  }

  // Save last turn
  if (currentTurn && currentTurn.events.length > 0) {
    turns.push(currentTurn)
  }

  return {
    turns,
    events: allEvents,
    pokemonInMatch,
    winner,
    winCondition,
  }
}

/**
 * Look ahead in the lines array for bullet points containing card names
 * Returns undefined if no card names are found
 */
function lookAheadForCardNames(lines: string[], currentIndex: number): string[] | undefined {
  const cardNames: string[] = []
  
  // Look at the next few lines for bullet points
  for (let j = currentIndex + 1; j < Math.min(currentIndex + 5, lines.length); j++) {
    const nextLine = lines[j]
    
    // Check if it's a bullet point with card names
    const cardListMatch = nextLine.match(/^[ ]{3}• (.+)$/)
    if (cardListMatch) {
      // Split by comma to get individual card names
      const names = cardListMatch[1].split(',').map(name => name.trim())
      cardNames.push(...names)
    } else if (!shouldSkipLine(nextLine) && nextLine.trim() !== '') {
      // Stop if we hit a non-skip, non-empty line that's not a bullet point
      break
    }
  }
  
  return cardNames.length > 0 ? cardNames : undefined
}

function addPokemonIfNew(list: string[], pokemon: string): void {
  if (!list.includes(pokemon)) {
    list.push(pokemon)
  }
}

function createDrawEvent(
  player: string,
  cardCount: number,
  cardNames: string[] | undefined,
  turn: number,
  timestamp: number
): GameEvent {
  const details: EventDetails = { cardCount }
  if (cardNames) {
    details.cardNames = cardNames
  }
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
    details: { pokemonName, location },
    timestamp,
  }
}

function createEvolveEvent(
  player: string,
  fromPokemon: string,
  toPokemon: string,
  turn: number,
  timestamp: number
): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'evolve',
    description: `${player} evolved ${fromPokemon} to ${toPokemon}`,
    details: { pokemonName: toPokemon, evolvedFrom: fromPokemon },
    timestamp,
  }
}

function createEnergyEvent(
  player: string,
  energyName: string,
  targetPokemon: string,
  turn: number,
  timestamp: number
): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'attach_energy',
    description: `${player} attached ${energyName} to ${targetPokemon}`,
    details: { pokemonName: targetPokemon },
    timestamp,
  }
}

function createTrainerEvent(
  player: string,
  trainerName: string,
  category: 'supporter' | 'item' | 'tool' | 'stadium',
  turn: number,
  timestamp: number
): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'play_trainer',
    description: `${player} played ${trainerName}`,
    details: { trainerName, trainerCategory: category },
    timestamp,
  }
}

function createAbilityEvent(
  player: string,
  pokemonName: string,
  abilityName: string,
  turn: number,
  timestamp: number
): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'use_ability',
    description: `${player}'s ${pokemonName} used ${abilityName}`,
    details: { pokemonName, attackName: abilityName },
    timestamp,
  }
}

function createAttackEvent(
  player: string,
  attackingPokemon: string,
  attackName: string,
  targetPokemon: string,
  damage: number,
  damageBreakdown: string | null,
  turn: number,
  timestamp: number
): GameEvent {
  const details: EventDetails = {
    attackingPokemon,
    attackName,
    targetPokemon,
    damage,
  }
  if (damageBreakdown) {
    details.damageBreakdown = damageBreakdown
  }
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'attack',
    description: `${player}'s ${attackingPokemon} used ${attackName} for ${damage} damage`,
    details,
    timestamp,
  }
}

function createKnockoutEvent(
  causingPlayer: string,
  knockedOutPokemon: string,
  turn: number,
  timestamp: number
): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player: causingPlayer,
    type: 'knockout',
    description: `${knockedOutPokemon} was Knocked Out`,
    details: { knockedOutPokemon },
    timestamp,
  }
}

function createPrizeTakenEvent(
  player: string,
  turn: number,
  timestamp: number
): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'prize_taken',
    description: `${player} took a Prize card`,
    details: { prizesTaken: 1 },
    timestamp,
  }
}

function createSwitchEvent(
  player: string,
  pokemonName: string,
  turn: number,
  timestamp: number
): GameEvent {
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'switch',
    description: `${player}'s ${pokemonName} is now in the Active Spot`,
    details: { pokemonName, location: 'active' },
    timestamp,
  }
}

function createCoinFlipEvent(
  player: string,
  headsCount: number,
  tailsCount: number,
  turn: number,
  timestamp: number
): GameEvent {
  const total = headsCount + tailsCount
  return {
    id: generateEventId(),
    turn,
    player,
    type: 'coin_flip',
    description: `Flipped ${total} coin${total !== 1 ? 's' : ''}, ${headsCount} heads`,
    details: { headsCount, tailsCount },
    timestamp,
  }
}

function createWinEvent(
  winner: string,
  winCondition: WinCondition,
  turn: number,
  timestamp: number
): GameEvent {
  const conditionText = {
    prizes: 'took all Prize cards',
    deck_out: "opponent's deck ran out",
    no_pokemon: 'opponent has no Pokemon',
    concede: 'opponent conceded',
  }[winCondition]

  return {
    id: generateEventId(),
    turn,
    player: winner,
    type: 'win',
    description: `${winner} wins - ${conditionText}`,
    details: { winCondition },
    timestamp,
  }
}
