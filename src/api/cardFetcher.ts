/**
 * CardFetcher service - LOCAL ONLY
 * Loads card images from local manifest (no API calls)
 */

import type { CardData } from '../types/deck'
import { getLocalCardImage } from './localCardImages'

// In-memory cache for card data
const cardCache = new Map<string, CardData>()

/**
 * Creates a placeholder CardData for cards not found locally
 */
function createPlaceholder(cardName: string): CardData {
  return {
    id: `placeholder-${cardName.toLowerCase().replace(/\s+/g, '-')}`,
    name: cardName,
    supertype: 'Unknown',
    subtypes: undefined,
    imageUrl: '',
    imageUrlHiRes: '',
    setName: 'Not Downloaded',
    setReleaseDate: '',
    isPlaceholder: true,
  }
}

/**
 * Fetches multiple cards in a single batch
 * LOCAL ONLY - no API calls, only uses downloaded images
 * @param cardNames - Array of card names to fetch
 * @returns Map of card name to CardData
 */
async function fetchCardBatch(cardNames: string[]): Promise<Map<string, CardData>> {
  const results = new Map<string, CardData>()
  
  if (cardNames.length === 0) {
    return results
  }

  console.log(`[CardFetcher] Looking up ${cardNames.length} cards locally...`)
  
  // Check local images for all cards
  const localCheckPromises = cardNames.map(async (cardName) => {
    const localImageUrl = await getLocalCardImage(cardName)
    return { cardName, localImageUrl }
  })
  
  const localChecks = await Promise.all(localCheckPromises)
  
  // Process results
  let found = 0
  let missing = 0
  
  for (const { cardName, localImageUrl } of localChecks) {
    if (localImageUrl) {
      const cardData: CardData = {
        id: `local-${cardName.toLowerCase().replace(/\s+/g, '-')}`,
        name: cardName,
        supertype: 'Unknown',
        subtypes: undefined,
        imageUrl: localImageUrl,
        imageUrlHiRes: localImageUrl,
        setName: 'Local',
        setReleaseDate: '',
        isPlaceholder: false,
      }
      cardCache.set(cardName, cardData)
      results.set(cardName, cardData)
      found++
    } else {
      // Return placeholder for cards not found locally
      const placeholder = createPlaceholder(cardName)
      cardCache.set(cardName, placeholder)
      results.set(cardName, placeholder)
      missing++
    }
  }

  console.log(`[CardFetcher] ✓ ${found} found, ✗ ${missing} missing`)
  
  return results
}

/**
 * Fetches a single card by name from local images
 * @param cardName - Name of the card to fetch
 * @returns CardData or placeholder if not found
 */
export async function fetchCard(cardName: string): Promise<CardData> {
  // Check cache first
  const cached = cardCache.get(cardName)
  if (cached) {
    return cached
  }

  // Fetch from local
  const results = await fetchCardBatch([cardName])
  return results.get(cardName) || createPlaceholder(cardName)
}

/**
 * Fetches multiple cards by name from local images
 * Updates are dispatched individually as each card loads
 * @param cardNames - Array of card names to fetch
 * @param onCardFetched - Callback for each card that finishes loading
 * @returns Map of card name to CardData
 */
export async function fetchCards(
  cardNames: string[],
  onCardFetched?: (cardName: string, cardData: CardData) => void
): Promise<Map<string, CardData>> {
  const results = new Map<string, CardData>()
  const uniqueNames = [...new Set(cardNames)]

  // Check cache first
  const uncachedNames: string[] = []
  for (const name of uniqueNames) {
    const cached = cardCache.get(name)
    if (cached) {
      results.set(name, cached)
      if (onCardFetched) {
        onCardFetched(name, cached)
      }
    } else {
      uncachedNames.push(name)
    }
  }

  // Fetch uncached cards
  if (uncachedNames.length > 0) {
    const fetchedResults = await fetchCardBatch(uncachedNames)
    fetchedResults.forEach((cardData, name) => {
      results.set(name, cardData)
      if (onCardFetched) {
        onCardFetched(name, cardData)
      }
    })
  }

  return results
}

/**
 * Clears the card cache
 */
export function clearCardCache(): void {
  cardCache.clear()
}

/**
 * Gets the current cache size
 */
export function getCardCacheSize(): number {
  return cardCache.size
}

/**
 * Checks if a card is in the cache
 */
export function isCardInCache(cardName: string): boolean {
  return cardCache.has(cardName)
}

/**
 * Gets a card from cache without fetching
 */
export function getCardFromCache(cardName: string): CardData | undefined {
  return cardCache.get(cardName)
}
