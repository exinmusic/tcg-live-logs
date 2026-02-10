/**
 * DeckCardDisplay Component
 * Displays a single card in the deck reconstruction view
 *
 * Requirements: 5.3, 5.5, 5.6, 6.3
 */

import { useState } from 'react'
import type { DeckCard, CardData } from '../types/deck'
import { getConfidenceClassName } from '../utils/deckDisplayUtils'
import './DeckCardDisplay.css'

export interface DeckCardDisplayProps {
  card: DeckCard
  cardData: CardData | null
  isLoading: boolean
}

export function DeckCardDisplay({ card, cardData, isLoading }: DeckCardDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const confidenceClass = getConfidenceClassName(card.confidence)

  // Determine what to display
  const showPlaceholder = isLoading || !cardData || imageError || cardData.isPlaceholder
  const imageUrl = cardData?.imageUrl

  return (
    <div
      className={`deck-card-display ${confidenceClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-image-container">
        {isLoading ? (
          <div className="card-placeholder card-placeholder--loading">
            <div className="loading-spinner-small" />
          </div>
        ) : showPlaceholder ? (
          <div className="card-placeholder">
            <span className="placeholder-text">{card.name}</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={card.name}
            className="card-image"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      <div className="card-info">
        <span className="card-name" title={card.name}>
          {card.name}
        </span>
        <span className="card-count">×{card.count}</span>
      </div>

      {/* Enlarged view on hover */}
      {isHovered && !showPlaceholder && imageUrl && (
        <div className="card-enlarged">
          <img src={cardData.imageUrlHiRes || imageUrl} alt={card.name} />
        </div>
      )}
    </div>
  )
}

export default DeckCardDisplay
