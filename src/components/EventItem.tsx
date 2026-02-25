/**
 * EventItem Component
 * Displays individual game events with appropriate formatting
 *
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */

import type { GameEvent, PokemonSprite } from '../types'
import { PokemonSprite as PokemonSpriteComponent } from './PokemonSprite'
import { PixelIcon, type IconType } from './PixelIcon'
import './EventItem.css'

export interface EventItemProps {
  event: GameEvent
  sprites: Map<string, PokemonSprite>
  isHighlighted: boolean
}

/**
 * Get icon type for event
 */
function getEventIconType(type: GameEvent['type']): IconType {
  // Map event types directly to icon types
  return type as IconType
}

/**
 * Extract Pokemon names from an event for sprite display
 */
function getPokemonFromEvent(event: GameEvent): string[] {
  const pokemon: string[] = []
  const { type, details } = event

  switch (type) {
    case 'attack':
      if (details.attackingPokemon) pokemon.push(details.attackingPokemon)
      if (details.targetPokemon) pokemon.push(details.targetPokemon)
      break
    case 'knockout':
      if (details.knockedOutPokemon) pokemon.push(details.knockedOutPokemon)
      break
    case 'play_pokemon':
    case 'evolve':
    case 'attach_energy':
    case 'switch':
    case 'use_ability':
      if (details.pokemonName) pokemon.push(details.pokemonName)
      if (details.evolvedFrom) pokemon.push(details.evolvedFrom)
      break
  }

  return pokemon
}

/**
 * Format event details for display
 */
function formatEventDetails(event: GameEvent): string {
  const { type, details, description } = event

  switch (type) {
    case 'attack':
      if (details.attackingPokemon && details.targetPokemon && details.attackName) {
        const damage = details.damage ? ` for ${details.damage} damage` : ''
        return `${details.attackingPokemon} used ${details.attackName} on ${details.targetPokemon}${damage}`
      }
      return description

    case 'knockout':
      if (details.knockedOutPokemon) {
        const prizes = details.prizesTaken ? ` (${details.prizesTaken} prize${details.prizesTaken > 1 ? 's' : ''} taken)` : ''
        return `${details.knockedOutPokemon} was knocked out${prizes}`
      }
      return description

    case 'play_pokemon':
      if (details.pokemonName && details.location) {
        return `Played ${details.pokemonName} to ${details.location === 'active' ? 'Active Spot' : 'Bench'}`
      }
      return description

    case 'evolve':
      if (details.pokemonName && details.evolvedFrom) {
        return `Evolved ${details.evolvedFrom} into ${details.pokemonName}`
      }
      return description

    case 'draw':
      if (details.cardCount) {
        return `Drew ${details.cardCount} card${details.cardCount > 1 ? 's' : ''}`
      }
      return description

    case 'play_trainer':
      if (details.trainerName) {
        const category = details.trainerCategory ? ` (${details.trainerCategory})` : ''
        return `Played ${details.trainerName}${category}`
      }
      return description

    case 'attach_energy':
      if (details.pokemonName) {
        return `Attached energy to ${details.pokemonName}`
      }
      return description

    case 'coin_flip':
      if (details.headsCount !== undefined && details.tailsCount !== undefined) {
        return `Coin flip: ${details.headsCount} heads, ${details.tailsCount} tails`
      }
      return description

    default:
      return description
  }
}

export function EventItem({ event, sprites, isHighlighted }: EventItemProps) {
  const iconType = getEventIconType(event.type)
  const formattedDetails = formatEventDetails(event)
  const pokemonNames = getPokemonFromEvent(event)

  return (
    <div className={`event-item ${isHighlighted ? 'event-item--highlighted' : ''}`}>
      <span className="event-icon">
        <PixelIcon type={iconType} size={20} />
      </span>
      <div className="event-content">
        <span className="event-type">{formatEventType(event.type)}</span>
        <span className="event-details">{formattedDetails}</span>
        {event.type === 'attack' && event.details.damage !== undefined && (
          <span className={`damage-badge ${event.details.damage >= 100 ? 'damage-badge--high' : ''}`}>
            {event.details.damage} DMG
          </span>
        )}
      </div>
      {pokemonNames.length > 0 && (
        <div className="event-sprites">
          {pokemonNames.map((name) => (
            <PokemonSpriteComponent
              key={name}
              pokemonName={name}
              sprite={sprites.get(name)}
              size="small"
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Format event type for display
 */
function formatEventType(type: GameEvent['type']): string {
  switch (type) {
    case 'draw':
      return 'Draw'
    case 'play_pokemon':
      return 'Play'
    case 'evolve':
      return 'Evolve'
    case 'attach_energy':
      return 'Energy'
    case 'play_trainer':
      return 'Trainer'
    case 'use_ability':
      return 'Ability'
    case 'attack':
      return 'Attack'
    case 'knockout':
      return 'KO'
    case 'prize_taken':
      return 'Prize'
    case 'switch':
      return 'Switch'
    case 'coin_flip':
      return 'Coin'
    case 'mulligan':
      return 'Mulligan'
    case 'win':
      return 'Win'
    default:
      return type
  }
}

export default EventItem
