/**
 * PlayerStatsCard Component
 * Displays individual player statistics with trainer card breakdown
 *
 * Requirements: 4.3
 */

import type { Player, PlayerStatistics, PokemonSprite } from '../types'
import { PixelIcon, type IconType } from './PixelIcon'
import './PlayerStatsCard.css'

export interface PlayerStatsCardProps {
  player: Player
  stats: PlayerStatistics | undefined
  sprites: Map<string, PokemonSprite>
  isWinner?: boolean
}

export function PlayerStatsCard({ player, stats, isWinner = false }: PlayerStatsCardProps) {
  // Handle case where stats might not exist
  if (!stats) {
    return (
      <div className="player-stats-card">
        <div className="player-header">
          <h3 className="player-name">{player.username}</h3>
          {player.isFirst && <span className="first-badge">Went First</span>}
        </div>
        <p className="no-stats">No statistics available</p>
      </div>
    )
  }

  const totalTrainers =
    stats.trainersPlayed.supporters.length +
    stats.trainersPlayed.items.length +
    stats.trainersPlayed.tools.length +
    stats.trainersPlayed.stadiums.length

  const totalTrainerCount =
    stats.trainersPlayed.supporters.reduce((sum, t) => sum + t.count, 0) +
    stats.trainersPlayed.items.reduce((sum, t) => sum + t.count, 0) +
    stats.trainersPlayed.tools.reduce((sum, t) => sum + t.count, 0) +
    stats.trainersPlayed.stadiums.reduce((sum, t) => sum + t.count, 0)

  return (
    <div className={`player-stats-card ${isWinner ? 'player-stats-card--winner' : ''}`}>
      <div className="player-header">
        <h3 className="player-name">
          {isWinner && (
            <span className="winner-icon">
              <PixelIcon type="winner" size={20} />
            </span>
          )}
          {player.username}
        </h3>
        {player.isFirst && <span className="first-badge">Went First</span>}
      </div>

      <div className="stats-grid">
        <StatItem label="Damage Dealt" value={stats.totalDamageDealt} iconType="damage" />
        <StatItem label="Cards Drawn" value={stats.totalCardsDrawn} iconType="draw" />
        <StatItem label="Pokemon KO'd" value={stats.pokemonKnockedOut} iconType="knockout" />
        <StatItem label="Prizes Taken" value={stats.prizeCardsTaken} iconType="prize_taken" />
        <StatItem label="Turns Played" value={stats.turnsPlayed} iconType="turns" />
        <StatItem
          label="Coin Flips"
          value={`${stats.coinFlips.heads}H / ${stats.coinFlips.tails}T`}
          iconType="coin_flip"
        />
      </div>

      <div className="trainer-section">
        <h4 className="trainer-title">
          Trainer Cards ({totalTrainerCount} played, {totalTrainers} unique)
        </h4>

        {stats.trainersPlayed.supporters.length > 0 && (
          <TrainerCategory
            title="Supporters"
            trainers={stats.trainersPlayed.supporters}
            color="#ff9f43"
          />
        )}

        {stats.trainersPlayed.items.length > 0 && (
          <TrainerCategory
            title="Items"
            trainers={stats.trainersPlayed.items}
            color="#54a0ff"
          />
        )}

        {stats.trainersPlayed.tools.length > 0 && (
          <TrainerCategory
            title="Tools"
            trainers={stats.trainersPlayed.tools}
            color="#5f27cd"
          />
        )}

        {stats.trainersPlayed.stadiums.length > 0 && (
          <TrainerCategory
            title="Stadiums"
            trainers={stats.trainersPlayed.stadiums}
            color="#10ac84"
          />
        )}

        {totalTrainers === 0 && (
          <p className="no-trainers">No trainer cards played</p>
        )}
      </div>
    </div>
  )
}

interface StatItemProps {
  label: string
  value: number | string
  iconType: IconType
}

function StatItem({ label, value, iconType }: StatItemProps) {
  return (
    <div className="stat-item">
      <span className="stat-icon">
        <PixelIcon type={iconType} size={20} />
      </span>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  )
}

interface TrainerCategoryProps {
  title: string
  trainers: { name: string; count: number }[]
  color: string
}

function TrainerCategory({ title, trainers, color }: TrainerCategoryProps) {
  return (
    <div className="trainer-category">
      <h5 className="category-title" style={{ color }}>
        {title}
      </h5>
      <ul className="trainer-list">
        {trainers.map((trainer) => (
          <li key={trainer.name} className="trainer-item">
            <span className="trainer-name">{trainer.name}</span>
            {trainer.count > 1 && (
              <span className="trainer-count">×{trainer.count}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerStatsCard
