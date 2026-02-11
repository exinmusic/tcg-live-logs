/**
 * DeckAnalysisView Component
 * Main view for displaying reconstructed decks for both players
 *
 * Requirements: 5.1, 5.2, 6.4, 7.1
 */

import { useState } from 'react'
import type { MatchData, PlayerDecks, CardFetchState, CardData } from '../types'
import { PlayerDeckCard } from './PlayerDeckCard'
import './DeckAnalysisView.css'

export interface DeckAnalysisViewProps {
  matchData: MatchData
  playerDecks: PlayerDecks | null
  cardData: Map<string, CardFetchState>
  errors: string[]
  onBulkDownload?: (cardNames: string[]) => Promise<void>
}

export function DeckAnalysisView({ playerDecks, cardData, errors, onBulkDownload }: DeckAnalysisViewProps) {
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)

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

  // Get all unique card names from both decks
  const getAllCardNames = (): string[] => {
    const cardNames = new Set<string>()
    Object.values(playerDecks).forEach((deck) => {
      deck.pokemon.forEach((card) => cardNames.add(card.name))
      deck.trainers.supporters.forEach((card) => cardNames.add(card.name))
      deck.trainers.items.forEach((card) => cardNames.add(card.name))
      deck.trainers.tools.forEach((card) => cardNames.add(card.name))
      deck.trainers.stadiums.forEach((card) => cardNames.add(card.name))
      deck.energy.basic.forEach((card) => cardNames.add(card.name))
      deck.energy.special.forEach((card) => cardNames.add(card.name))
    })
    return Array.from(cardNames)
  }

  // Check how many cards are already cached
  const allCardNames = getAllCardNames()
  const cachedCount = Array.from(cardData.entries()).filter(
    ([, state]) => state.data && !state.data.isPlaceholder && !state.isLoading
  ).length
  const uncachedCount = allCardNames.length - cachedCount

  const handleBulkDownload = async () => {
    if (!onBulkDownload) return
    
    console.log('[DeckAnalysisView] Starting bulk download for', allCardNames.length, 'cards')
    setIsBulkDownloading(true)
    try {
      await onBulkDownload(allCardNames)
      console.log('[DeckAnalysisView] Bulk download complete')
    } catch (error) {
      console.error('[DeckAnalysisView] Bulk download failed:', error)
    } finally {
      setIsBulkDownloading(false)
    }
  }

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

  // Calculate download progress
  const downloadProgress = {
    current: cachedCount,
    total: allCardNames.length,
  }

  return (
    <div className="deck-analysis-view">
      <div className="deck-analysis-header">
        <h2 className="deck-analysis-title">Deck Analysis</h2>
        <p className="deck-disclaimer">
          This reconstruction is based on cards observed during gameplay. Not all cards in each
          player's deck may be shown.
        </p>
        
        {/* Bulk Download Button */}
        {uncachedCount > 0 && !isBulkDownloading && (
          <button className="bulk-download-btn" onClick={handleBulkDownload}>
            ⚡ Download All Card Images ({uncachedCount} remaining)
          </button>
        )}

        {/* Download Progress */}
        {(isBulkDownloading || isLoadingImages) && (
          <div className="download-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
              />
            </div>
            <span className="progress-text">
              {isBulkDownloading ? 'Downloading' : 'Loading'} {downloadProgress.current} / {downloadProgress.total} cards...
            </span>
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
