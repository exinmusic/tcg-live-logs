/**
 * Local Card Image Loader
 * Loads card images from local manifest instead of API
 */

interface ManifestCard {
  id: string
  filename: string
  set: string
  setId: string
  releaseDate: string
}

interface Manifest {
  version: number
  downloadedAt: string
  cards: Array<{
    id: string
    name: string
    set: string
    setId: string
    releaseDate: string
    filename: string
  }>
  byName: Record<string, ManifestCard[]>
}

let manifestCache: Manifest | null = null
let manifestLoadPromise: Promise<Manifest | null> | null = null

/**
 * Normalize card name for lookup (lowercase, no special chars)
 */
function normalizeCardName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Load the manifest from public/card-images/manifest.json
 */
async function loadManifest(): Promise<Manifest | null> {
  // Return cached manifest if available
  if (manifestCache) {
    console.log('[LocalCardImages] Using cached manifest')
    return manifestCache
  }

  // Return existing promise if already loading
  if (manifestLoadPromise) {
    console.log('[LocalCardImages] Waiting for manifest load in progress')
    return manifestLoadPromise
  }

  console.log('[LocalCardImages] Loading manifest...')
  manifestLoadPromise = (async () => {
    try {
      const response = await fetch('/card-images/manifest.json')
      if (!response.ok) {
        console.warn('[LocalCardImages] Manifest not found:', response.status)
        return null
      }
      const manifest = await response.json() as Manifest
      manifestCache = manifest
      console.log(`[LocalCardImages] Loaded manifest with ${manifest.cards?.length || 0} cards, ${Object.keys(manifest.byName || {}).length} unique names`)
      return manifest
    } catch (error) {
      console.error('[LocalCardImages] Failed to load manifest:', error)
      return null
    } finally {
      manifestLoadPromise = null
    }
  })()

  return manifestLoadPromise
}

/**
 * Get local image URL for a card by name
 * Returns the most recent version if multiple exist
 * @param cardName - Name of the card
 * @returns Local image URL or null if not found
 */
export async function getLocalCardImage(cardName: string): Promise<string | null> {
  const manifest = await loadManifest()
  if (!manifest || !manifest.byName) {
    console.log(`[LocalCardImages] No manifest available for "${cardName}"`)
    return null
  }

  const normalized = normalizeCardName(cardName)
  const matches = manifest.byName[normalized]

  if (!matches || matches.length === 0) {
    console.log(`[LocalCardImages] No local image for "${cardName}" (normalized: "${normalized}")`)
    return null
  }

  // Return most recent (first in sorted array)
  const mostRecent = matches[0]
  const url = `/card-images/${mostRecent.filename}`
  console.log(`[LocalCardImages] Found local image for "${cardName}": ${url}`)
  return url
}

/**
 * Get all local image URLs for a card by name (all versions)
 * @param cardName - Name of the card
 * @returns Array of local image URLs with metadata
 */
export async function getAllLocalCardImages(cardName: string): Promise<Array<{
  url: string
  set: string
  setId: string
  releaseDate: string
}>> {
  const manifest = await loadManifest()
  if (!manifest || !manifest.byName) {
    return []
  }

  const normalized = normalizeCardName(cardName)
  const matches = manifest.byName[normalized]

  if (!matches || matches.length === 0) {
    return []
  }

  return matches.map(card => ({
    url: `/card-images/${card.filename}`,
    set: card.set,
    setId: card.setId,
    releaseDate: card.releaseDate,
  }))
}

/**
 * Check if a card image is available locally
 * @param cardName - Name of the card
 * @returns true if the card is available locally
 */
export async function hasLocalCardImage(cardName: string): Promise<boolean> {
  const manifest = await loadManifest()
  if (!manifest || !manifest.byName) {
    return false
  }

  const normalized = normalizeCardName(cardName)
  return !!manifest.byName[normalized]
}

/**
 * Get manifest statistics
 */
export async function getManifestStats(): Promise<{
  totalCards: number
  uniqueNames: number
  lastUpdated: string
} | null> {
  const manifest = await loadManifest()
  if (!manifest) {
    return null
  }

  return {
    totalCards: manifest.cards?.length || 0,
    uniqueNames: Object.keys(manifest.byName || {}).length,
    lastUpdated: manifest.downloadedAt,
  }
}

/**
 * Preload manifest (call early in app lifecycle)
 */
export function preloadManifest(): void {
  loadManifest()
}
