/**
 * DeckAnalysisView Component
 * Main view for displaying reconstructed decks for both players
 *
 * Requirements: 5.1, 5.2, 6.4, 7.1
 */

import type { MatchData, PlayerDecks, CardFetchState, CardData } from '../types'
import { PlayerDeckCard } from './PlayerDeckCard'
import './DeckAnalysisView.css'

export interface DeckAnalysisViewProps {
  matchData: MatchData
  playerDecks: PlayerDecks | null
  cardData: Map<string, CardFetchState>
  errors: string[]
}

export function DeckAnalysisView({ playerDecks, cardData, errors }: DeckAnalysisViewProps) {
  if (!playerDecks) {
    return (
      <div className="deck-analysis-view">
        <div className="loading-message">Reconstructing decks...</div>
      </div>
    )
  }

  const playerNames = Object.keys(playerDecks)
  const isLoadingImages = Array.from(cardData.values()).some((state) => state.isLoading)
  const apiError = errors.length > 0 ? errors[0] : null

  // Convert CardFetchState map to CardData map for PlayerDeckCard
  const cardDataMap = new Map<string, CardData>()
  cardData.forEach((state, name) => {
    if (state.data) {
      cardDataMap.set(name, state.data)
    }
  })

  // Get loading cards
  const loadingCards = new Set<string>()
  cardData.forEach((state, name) => {
    if (state.isLoading) {
      loadingCards.add(name)
    }
  })

  return (
    <div className="deck-analysis-view">
      <div className="deck-analysis-header">
        <h2 className="deck-analysis-title">Deck Analysis</h2>
        <p className="deck-disclaimer">
          This reconstruction is based on cards observed during gameplay. Not all cards in each
          player's deck may be shown.
        </p>
        {isLoadingImages && (
          <div className="loading-banner">
            <span className="loading-icon">⏳</span>
            Loading card images...
          </div>
        )}
        {apiError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {apiError}
          </div>
        )}
      </div>

      <div className="deck-comparison">
        {playerNames.map((playerName) => (
          <PlayerDeckCard
            key={playerName}
            deck={playerDecks[playerName]}
            cardDataMap={cardDataMap}
            loadingCards={loadingCards}
          />
        ))}
      </div>
    </div>
  )
}

export default DeckAnalysisView
