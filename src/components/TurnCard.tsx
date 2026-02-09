/**
 * TurnCard Component
 * Displays a single turn with expandable details
 *
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */

import { useState } from 'react'
import type { Turn, PokemonSprite } from '../types'
import { EventItem } from './EventItem'
import { isSignificantEvent } from '../utils'
import './TurnCard.css'

export interface TurnCardProps {
  turn: Turn
  playerColors: Map<string, string>
  sprites: Map<string, PokemonSprite>
}

export function TurnCard({ turn, playerColors, sprites }: TurnCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const playerColor = playerColors.get(turn.player) || '#646cff'

  // Count significant events for the summary
  const significantEvents = turn.events.filter((event) => isSignificantEvent(event))
  const hasSignificantEvents = significantEvents.length > 0

  return (
    <div
      className={`turn-card ${isExpanded ? 'turn-card--expanded' : ''}`}
      style={{ borderLeftColor: playerColor }}
    >
      <button
        className="turn-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`turn-${turn.number}-content`}
      >
        <div className="turn-info">
          <span className="turn-number">Turn {turn.number}</span>
          <span className="turn-player" style={{ color: playerColor }}>
            {turn.player}
          </span>
        </div>
        <div className="turn-summary">
          <span className="event-count">{turn.events.length} actions</span>
          {hasSignificantEvents && (
            <span className="significant-badge" title="Contains significant events">
              ⚡
            </span>
          )}
        </div>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div id={`turn-${turn.number}-content`} className="turn-content">
          {turn.events.length === 0 ? (
            <p className="no-events">No events recorded for this turn.</p>
          ) : (
            <ul className="event-list">
              {turn.events.map((event) => (
                <li key={event.id}>
                  <EventItem
                    event={event}
                    sprites={sprites}
                    isHighlighted={isSignificantEvent(event)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default TurnCard
