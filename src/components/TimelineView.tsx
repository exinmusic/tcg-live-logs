/**
 * TimelineView Component
 * Displays game turns in chronological order with player color coding
 *
 * Requirements: 3.1, 3.2
 */

import type { MatchData, Turn, PokemonSprite } from '../types'
import { TurnCard } from './TurnCard'
import './TimelineView.css'

export interface TimelineViewProps {
  matchData: MatchData
  sprites: Map<string, PokemonSprite>
}

/**
 * Generate consistent player colors based on player index
 */
function getPlayerColors(players: MatchData['players']): Map<string, string> {
  const colors = new Map<string, string>()
  colors.set(players[0].username, '#646cff') // Primary blue
  colors.set(players[1].username, '#ff6b6b') // Secondary red
  return colors
}

export function TimelineView({ matchData, sprites }: TimelineViewProps) {
  const playerColors = getPlayerColors(matchData.players)

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <h2 className="timeline-title">Match Timeline</h2>
        <div className="player-legend">
          {matchData.players.map((player) => (
            <div key={player.username} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: playerColors.get(player.username) }}
              />
              <span className="legend-name">
                {player.username}
                {player.isFirst && ' (First)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="timeline-content">
        {matchData.turns.length === 0 ? (
          <p className="no-turns">No turns recorded in this match.</p>
        ) : (
          matchData.turns.map((turn: Turn) => (
            <TurnCard
              key={`turn-${turn.number}-${turn.player}`}
              turn={turn}
              playerColors={playerColors}
              sprites={sprites}
            />
          ))
        )}
      </div>

      {matchData.winner && (
        <div className="timeline-footer">
          <div className="winner-banner">
            <span className="winner-icon">🏆</span>
            <span className="winner-text">
              {matchData.winner} wins by {formatWinCondition(matchData.winCondition)}!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Format win condition for display
 */
function formatWinCondition(condition: MatchData['winCondition']): string {
  switch (condition) {
    case 'prizes':
      return 'taking all prize cards'
    case 'deck_out':
      return 'opponent deck out'
    case 'no_pokemon':
      return 'opponent having no Pokemon'
    case 'concede':
      return 'opponent concession'
    default:
      return condition
  }
}

export default TimelineView
