/**
 * CardFetcher service for Pokemon TCG API integration
 * Handles fetching card data with caching and rate limiting
 */

import * as PokemonTCG from 'pokemon-tcg-sdk-typescript'
import type { Card } from 'pokemon-tcg-sdk-typescript/dist/interfaces/card'
import type { CardData } from '../types/deck'

// In-memory cache for card data
const cardCache = new Map<string, CardData>()

// Rate limiting configuration (30 requests/minute without API key)
const RATE_LIMIT_DELAY_MS = 2000 // 2 seconds between requests
let lastRequestTime = 0

// Request queue for batch fetches
interface QueuedRequest {
  cardName: string
  resolve: (value: CardData) => void
  reject: (error: Error) => void
}
const requestQueue: QueuedRequest[] = []
let isProcessingQueue = false

/**
 * Creates a placeholder CardData for cards not found in the API
 */
function createPlaceholder(cardName: string): CardData {
  return {
    id: `placeholder-${cardName.toLowerCase().replace(/\s+/g, '-')}`,
    name: cardName,
    supertype: 'Unknown',
    subtypes: undefined,
    imageUrl: '',
    imageUrlHiRes: '',
    setName: 'Unknown',
    setReleaseDate: '',
    isPlaceholder: true,
  }
}

/**
 * Converts SDK Card to our CardData interface
 */
function convertToCardData(card: Card): CardData {
  return {
    id: card.id,
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes,
    imageUrl: card.images?.small || '',
    imageUrlHiRes: card.images?.large || '',
    setName: card.set?.name || 'Unknown',
    setReleaseDate: card.set?.releaseDate || '',
    isPlaceholder: false,
  }
}

/**
 * Selects the most recent card version by set release date
 */
function selectMostRecentCard(cards: Card[]): Card {
  if (cards.length === 0) {
    throw new Error('No cards to select from')
  }
  if (cards.length === 1) {
    return cards[0]
  }

  return cards.reduce((mostRecent, current) => {
    const currentDate = current.set?.releaseDate || ''
    const mostRecentDate = mostRecent.set?.releaseDate || ''
    return currentDate > mostRecentDate ? current : mostRecent
  })
}

/**
 * Waits for rate limit delay if needed
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
    const waitTime = RATE_LIMIT_DELAY_MS - timeSinceLastRequest
    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }
  lastRequestTime = Date.now()
}

/**
 * Fetches a single card by name from the Pokemon TCG API
 * Uses caching to avoid redundant API calls
 * @param cardName - Name of the card to fetch
 * @returns CardData or placeholder if not found
 */
export async function fetchCard(cardName: string): Promise<CardData> {
  // Check cache first
  const cached = cardCache.get(cardName)
  if (cached) {
    return cached
  }

  try {
    // Wait for rate limit
    await waitForRateLimit()

    // Query API by card name
    const cards = await PokemonTCG.PokemonTCG.findCardsByQueries({ q: `name:"${cardName}"` })

    if (!cards || cards.length === 0) {
      // Return placeholder for cards not found
      const placeholder = createPlaceholder(cardName)
      cardCache.set(cardName, placeholder)
      return placeholder
    }

    // Select most recent version
    const selectedCard = selectMostRecentCard(cards)
    const cardData = convertToCardData(selectedCard)

    // Store in cache
    cardCache.set(cardName, cardData)

    return cardData
  } catch (error) {
    // On error, return placeholder and cache it
    console.error('[CardFetcher] Error fetching card:', cardName, error)
    const placeholder = createPlaceholder(cardName)
    cardCache.set(cardName, placeholder)
    return placeholder
  }
}

/**
 * Processes the request queue sequentially with rate limiting
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  while (requestQueue.length > 0) {
    const request = requestQueue.shift()
    if (!request) continue

    try {
      const cardData = await fetchCard(request.cardName)
      request.resolve(cardData)
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  isProcessingQueue = false
}

/**
 * Adds a card fetch request to the queue
 */
function queueFetch(cardName: string): Promise<CardData> {
  // Check cache first - no need to queue if cached
  const cached = cardCache.get(cardName)
  if (cached) {
    return Promise.resolve(cached)
  }

  return new Promise((resolve, reject) => {
    requestQueue.push({ cardName, resolve, reject })
    processQueue()
  })
}

/**
 * Fetches multiple cards by name with caching and rate limiting
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

  // Queue all fetches
  const fetchPromises = uniqueNames.map(async (name) => {
    const cardData = await queueFetch(name)
    results.set(name, cardData)
    // Call callback immediately when this card finishes
    if (onCardFetched) {
      onCardFetched(name, cardData)
    }
  })

  await Promise.all(fetchPromises)

  return results
}

/**
 * Clears the card cache (useful for testing)
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
