/**
 * DeckCardDisplay Component
 * Displays a single card in the deck reconstruction view
 * Supports cycling through multiple card versions on click
 *
 * Requirements: 5.3, 5.5, 5.6, 6.3
 */

import { useState, useEffect } from 'react'
import type { DeckCard, CardData } from '../types/deck'
import { getConfidenceClassName } from '../utils/deckDisplayUtils'
import { getAllLocalCardImages } from '../api/localCardImages'
import './DeckCardDisplay.css'

export interface DeckCardDisplayProps {
  card: DeckCard
  cardData: CardData | null
  isLoading: boolean
}

interface CardVariant {
  url: string
  set: string
  setId: string
  releaseDate: string
  id: string
}

export function DeckCardDisplay({ card, cardData, isLoading }: DeckCardDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [variants, setVariants] = useState<CardVariant[]>([])
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0)

  const confidenceClass = getConfidenceClassName(card.confidence)

  // Load all variants when card data is available
  useEffect(() => {
    if (cardData && !cardData.isPlaceholder) {
      getAllLocalCardImages(card.name).then(allVariants => {
        if (allVariants.length > 0) {
          setVariants(allVariants)
          setCurrentVariantIndex(0)
          console.log(`[DeckCardDisplay] Loaded ${allVariants.length} variants for ${card.name}:`, allVariants.map(v => `${v.setId} (${v.releaseDate})`))
        }
      })
    }
  }, [card.name, cardData])

  // Cycle to next variant on click
  const handleCycleVariant = () => {
    if (variants.length > 1) {
      setCurrentVariantIndex((prev) => (prev + 1) % variants.length)
      setImageError(false)
    }
  }

  // Determine what to display
  const showPlaceholder = isLoading || !cardData || imageError || cardData.isPlaceholder
  const currentVariant = variants.length > 0 ? variants[currentVariantIndex] : null
  // Prefer variant URL over cardData URL to ensure we show the most recent version
  const imageUrl = currentVariant?.url || cardData?.imageUrl
  const hasMultipleVariants = variants.length > 1

  return (
    <div
      className={`deck-card-display ${confidenceClass} ${hasMultipleVariants ? 'has-variants' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCycleVariant}
      style={{ cursor: hasMultipleVariants ? 'pointer' : 'default' }}
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
        {hasMultipleVariants && !showPlaceholder && (
          <div className="variant-indicator">
            {currentVariantIndex + 1}/{variants.length}
          </div>
        )}
      </div>

      <div className="card-info">
        <span className="card-name" title={card.name}>
          {card.name}
        </span>
        <span className="card-count">×{card.count}</span>
      </div>

      {currentVariant && hasMultipleVariants && (
        <div className="card-set-info" title={`${currentVariant.set} (${currentVariant.releaseDate})`}>
          {currentVariant.setId}
        </div>
      )}

      {/* Enlarged view on hover */}
      {isHovered && !showPlaceholder && imageUrl && (
        <div className="card-enlarged">
          <img src={currentVariant?.url || cardData?.imageUrlHiRes || imageUrl} alt={card.name} />
          {currentVariant && (
            <div className="enlarged-set-info">
              {currentVariant.set} ({currentVariant.releaseDate})
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DeckCardDisplay
