/**
 * CardFetcher service for Pokemon TCG API integration
 * Handles fetching card data with caching and rate limiting
 */

// Set up process.env polyfill for browser before importing SDK
if (typeof process === 'undefined') {
  // @ts-expect-error - Polyfill for browser environment
  globalThis.process = { env: {} }
}
// @ts-expect-error - Setting env var for SDK
process.env.POKEMONTCG_API_KEY = '3e03e81c-e00e-4c9b-833c-cccdcd83c5c2'

import * as PokemonTCG from 'pokemon-tcg-sdk-typescript'
import type { Card } from 'pokemon-tcg-sdk-typescript/dist/interfaces/card'
import type { CardData } from '../types/deck'

// In-memory cache for card data
const cardCache = new Map<string, CardData>()

// LocalStorage key for persistent cache
const CACHE_STORAGE_KEY = 'pokemon-tcg-card-cache'
const CACHE_VERSION = 1

// Load cache from localStorage on initialization
function loadCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.version === CACHE_VERSION && Array.isArray(parsed.data)) {
        parsed.data.forEach(([key, value]: [string, CardData]) => {
          cardCache.set(key, value)
        })
        console.log(`[CardFetcher] Loaded ${cardCache.size} cards from cache`)
      }
    }
  } catch (error) {
    console.warn('[CardFetcher] Failed to load cache from storage:', error)
  }
}

// Save cache to localStorage
function saveCacheToStorage(): void {
  try {
    const data = Array.from(cardCache.entries())
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({
      version: CACHE_VERSION,
      data
    }))
  } catch (error) {
    console.warn('[CardFetcher] Failed to save cache to storage:', error)
  }
}

// Initialize cache from storage
loadCacheFromStorage()

// Rate limiting configuration (with API key: 20,000 requests/day)
const RATE_LIMIT_DELAY_MS = 100 // Minimal delay with API key
const BATCH_SIZE = 10 // Fetch up to 10 cards per API request
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
 * Fetches multiple cards in a single batch request
 * @param cardNames - Array of card names to fetch
 * @returns Map of card name to CardData
 */
async function fetchCardBatch(cardNames: string[]): Promise<Map<string, CardData>> {
  const results = new Map<string, CardData>()
  
  if (cardNames.length === 0) {
    return results
  }

  try {
    // Wait for rate limit
    await waitForRateLimit()

    // Build query for multiple cards: name:"Pikachu" OR name:"Charizard"
    const query = cardNames.map(name => `name:"${name}"`).join(' OR ')
    
    // Query API with batch query
    const cards = await PokemonTCG.PokemonTCG.findCardsByQueries({ q: query })

    // Group cards by name
    const cardsByName = new Map<string, Card[]>()
    if (cards && cards.length > 0) {
      cards.forEach(card => {
        const existing = cardsByName.get(card.name) || []
        existing.push(card)
        cardsByName.set(card.name, existing)
      })
    }

    // Process each requested card
    cardNames.forEach(cardName => {
      const matchingCards = cardsByName.get(cardName)
      
      if (!matchingCards || matchingCards.length === 0) {
        // Return placeholder for cards not found
        const placeholder = createPlaceholder(cardName)
        cardCache.set(cardName, placeholder)
        results.set(cardName, placeholder)
      } else {
        // Select most recent version
        const selectedCard = selectMostRecentCard(matchingCards)
        const cardData = convertToCardData(selectedCard)
        
        // Store in cache
        cardCache.set(cardName, cardData)
        results.set(cardName, cardData)
      }
    })

    // Save updated cache to localStorage
    saveCacheToStorage()

    return results
  } catch (error) {
    // On error, return placeholders for all cards
    console.error('[CardFetcher] Error fetching card batch:', error)
    cardNames.forEach(cardName => {
      const placeholder = createPlaceholder(cardName)
      cardCache.set(cardName, placeholder)
      results.set(cardName, placeholder)
    })
    return results
  }
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

  // Use batch fetch for single card
  const results = await fetchCardBatch([cardName])
  return results.get(cardName) || createPlaceholder(cardName)
}

/**
 * Processes the request queue in batches with rate limiting
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  while (requestQueue.length > 0) {
    // Take a batch of requests
    const batch = requestQueue.splice(0, BATCH_SIZE)
    const cardNames = batch.map(req => req.cardName)

    try {
      const results = await fetchCardBatch(cardNames)
      
      // Resolve each request with its result
      batch.forEach(request => {
        const cardData = results.get(request.cardName)
        if (cardData) {
          request.resolve(cardData)
        } else {
          request.resolve(createPlaceholder(request.cardName))
        }
      })
    } catch (error) {
      // Reject all requests in the batch
      batch.forEach(request => {
        request.reject(error instanceof Error ? error : new Error(String(error)))
      })
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
  try {
    localStorage.removeItem(CACHE_STORAGE_KEY)
  } catch (error) {
    console.warn('[CardFetcher] Failed to clear cache from storage:', error)
  }
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
