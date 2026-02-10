/**
 * PlayerDeckCard Component
 * Displays a player's reconstructed deck with all categories
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 5.4
 */

import type { ReconstructedDeck, CardData } from '../types/deck'
import { DeckCategorySection } from './DeckCategorySection'
import { calculateDeckSummary } from '../utils/deckDisplayUtils'

export interface PlayerDeckCardProps {
  deck: ReconstructedDeck
  cardDataMap: Map<string, CardData | null>
  loadingCards: Set<string>
}

export function PlayerDeckCard({ deck, cardDataMap, loadingCards }: PlayerDeckCardProps) {
  const summary = calculateDeckSummary(deck)

  return (
    <div className="player-deck-card">
      <div className="deck-header">
        <h3 className="player-name">{deck.playerName}</h3>
        <div className="deck-summary">
          <span className="summary-item">
            Total: <strong>{summary.total}</strong> cards observed
          </span>
        </div>
      </div>

      <div className="deck-categories">
        {/* Pokemon Section */}
        <DeckCategorySection
          title="Pokémon"
          cards={deck.pokemon}
          cardDataMap={cardDataMap}
          loadingCards={loadingCards}
        />

        {/* Trainer Sections */}
        <DeckCategorySection
          title="Supporters"
          cards={deck.trainers.supporters}
          cardDataMap={cardDataMap}
          loadingCards={loadingCards}
        />

        <DeckCategorySection
          title="Items"
          cards={deck.trainers.items}
          cardDataMap={cardDataMap}
          loadingCards={loadingCards}
        />

        <DeckCategorySection
          title="Tools"
          cards={deck.trainers.tools}
          cardDataMap={cardDataMap}
          loadingCards={loadingCards}
        />

        <DeckCategorySection
          title="Stadiums"
          cards={deck.trainers.stadiums}
          cardDataMap={cardDataMap}
          loadingCards={loadingCards}
        />

        {/* Energy Sections */}
        <DeckCategorySection
          title="Basic Energy"
          cards={deck.energy.basic}
          cardDataMap={cardDataMap}
          loadingCards={loadingCards}
        />

        <DeckCategorySection
          title="Special Energy"
          cards={deck.energy.special}
          cardDataMap={cardDataMap}
          loadingCards={loadingCards}
        />
      </div>

      {/* Category breakdown */}
      <div className="deck-breakdown">
        <span className="breakdown-item">
          Pokémon: <strong>{summary.pokemon}</strong>
        </span>
        <span className="breakdown-item">
          Trainers: <strong>{summary.trainers}</strong>
        </span>
        <span className="breakdown-item">
          Energy: <strong>{summary.energy}</strong>
        </span>
      </div>
    </div>
  )
}

export default PlayerDeckCard
