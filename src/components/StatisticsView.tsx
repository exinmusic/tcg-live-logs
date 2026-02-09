/**
 * StatisticsView Component
 * Displays aggregated match statistics with side-by-side player comparison
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import type { MatchData, PokemonSprite } from '../types'
import { PlayerStatsCard } from './PlayerStatsCard'
import './StatisticsView.css'

export interface StatisticsViewProps {
  matchData: MatchData
  sprites: Map<string, PokemonSprite>
}

export function StatisticsView({ matchData, sprites }: StatisticsViewProps) {
  const [player1, player2] = matchData.players
  const stats1 = matchData.statistics[player1.username]
  const stats2 = matchData.statistics[player2.username]

  // Calculate total turns
  const totalTurns = matchData.turns.length

  return (
    <div className="statistics-view">
      <div className="statistics-header">
        <h2 className="statistics-title">Match Statistics</h2>
        <div className="match-summary">
          <span className="total-turns">{totalTurns} turns played</span>
          {matchData.winner && (
            <span className="winner-info">
              Winner: <strong>{matchData.winner}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="statistics-comparison">
        <PlayerStatsCard
          player={player1}
          stats={stats1}
          sprites={sprites}
          isWinner={matchData.winner === player1.username}
        />
        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>
        <PlayerStatsCard
          player={player2}
          stats={stats2}
          sprites={sprites}
          isWinner={matchData.winner === player2.username}
        />
      </div>

      <div className="statistics-footer">
        <h3 className="comparison-title">Head-to-Head Comparison</h3>
        <div className="comparison-bars">
          <ComparisonBar
            label="Damage Dealt"
            value1={stats1?.totalDamageDealt ?? 0}
            value2={stats2?.totalDamageDealt ?? 0}
            player1={player1.username}
            player2={player2.username}
          />
          <ComparisonBar
            label="Cards Drawn"
            value1={stats1?.totalCardsDrawn ?? 0}
            value2={stats2?.totalCardsDrawn ?? 0}
            player1={player1.username}
            player2={player2.username}
          />
          <ComparisonBar
            label="Pokemon KO'd"
            value1={stats1?.pokemonKnockedOut ?? 0}
            value2={stats2?.pokemonKnockedOut ?? 0}
            player1={player1.username}
            player2={player2.username}
          />
          <ComparisonBar
            label="Prizes Taken"
            value1={stats1?.prizeCardsTaken ?? 0}
            value2={stats2?.prizeCardsTaken ?? 0}
            player1={player1.username}
            player2={player2.username}
          />
        </div>
      </div>
    </div>
  )
}

interface ComparisonBarProps {
  label: string
  value1: number
  value2: number
  player1: string
  player2: string
}

function ComparisonBar({ label, value1, value2, player1, player2 }: ComparisonBarProps) {
  const total = value1 + value2
  const percent1 = total > 0 ? (value1 / total) * 100 : 50
  const percent2 = total > 0 ? (value2 / total) * 100 : 50

  return (
    <div className="comparison-bar">
      <div className="comparison-label">{label}</div>
      <div className="comparison-values">
        <span className="value-left" title={player1}>
          {value1}
        </span>
        <div className="bar-container">
          <div
            className="bar-fill bar-fill--left"
            style={{ width: `${percent1}%` }}
            aria-label={`${player1}: ${value1}`}
          />
          <div
            className="bar-fill bar-fill--right"
            style={{ width: `${percent2}%` }}
            aria-label={`${player2}: ${value2}`}
          />
        </div>
        <span className="value-right" title={player2}>
          {value2}
        </span>
      </div>
    </div>
  )
}

export default StatisticsView
