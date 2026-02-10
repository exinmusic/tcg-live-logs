/**
 * DeckCategorySection Component
 * Displays a category section with header and grid of cards
 *
 * Requirements: 3.1, 3.2
 */

import type { DeckCard, CardData } from '../types/deck'
import { DeckCardDisplay } from './DeckCardDisplay'

export interface DeckCategorySectionProps {
  title: string
  cards: DeckCard[]
  cardDataMap: Map<string, CardData | null>
  loadingCards: Set<string>
}

export function DeckCategorySection({
  title,
  cards,
  cardDataMap,
  loadingCards,
}: DeckCategorySectionProps) {
  if (cards.length === 0) {
    return null
  }

  const totalCount = cards.reduce((sum, card) => sum + card.count, 0)

  return (
    <div className="deck-category-section">
      <h4 className="category-header">
        {title} <span className="category-count">({totalCount} cards)</span>
      </h4>
      <div className="category-grid">
        {cards.map((card) => (
          <DeckCardDisplay
            key={card.name}
            card={card}
            cardData={cardDataMap.get(card.name) || null}
            isLoading={loadingCards.has(card.name)}
          />
        ))}
      </div>
    </div>
  )
}

export default DeckCategorySection
