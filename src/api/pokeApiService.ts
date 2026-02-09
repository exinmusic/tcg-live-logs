/**
 * PokeAPI Service for fetching Pokemon sprites with caching.
 */

import { normalizePokemonName } from './normalization';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const PLACEHOLDER_SPRITE = '/placeholder-pokemon.png';

interface PokeAPIResponse {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    other: {
      'official-artwork': {
        front_default: string | null;
      };
    };
  };
}

export interface SpriteResult {
  name: string;
  spriteUrl: string;
  isPlaceholder: boolean;
}

// In-memory cache for sprites
const spriteCache = new Map<string, SpriteResult>();

// Track pending requests to prevent duplicate concurrent fetches
const pendingRequests = new Map<string, Promise<SpriteResult>>();

/**
 * Fetches a Pokemon sprite from PokeAPI with caching.
 * Returns a placeholder if the fetch fails.
 *
 * @param pokemonName - The Pokemon name from the TCG log
 * @returns A SpriteResult with the sprite URL or placeholder
 */
export async function fetchSprite(pokemonName: string): Promise<SpriteResult> {
  const normalizedName = normalizePokemonName(pokemonName);

  if (!normalizedName) {
    return {
      name: pokemonName,
      spriteUrl: PLACEHOLDER_SPRITE,
      isPlaceholder: true,
    };
  }

  // Check cache first
  const cached = spriteCache.get(normalizedName);
  if (cached) {
    return { ...cached, name: pokemonName };
  }

  // Check if there's already a pending request for this Pokemon
  const pending = pendingRequests.get(normalizedName);
  if (pending) {
    const result = await pending;
    return { ...result, name: pokemonName };
  }

  // Create the fetch promise
  const fetchPromise = fetchFromApi(normalizedName, pokemonName);
  pendingRequests.set(normalizedName, fetchPromise);

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    pendingRequests.delete(normalizedName);
  }
}

async function fetchFromApi(
  normalizedName: string,
  originalName: string
): Promise<SpriteResult> {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/${normalizedName}`);

    if (!response.ok) {
      // Pokemon not found or other error
      const result: SpriteResult = {
        name: originalName,
        spriteUrl: PLACEHOLDER_SPRITE,
        isPlaceholder: true,
      };
      // Cache the failure to avoid repeated failed requests
      spriteCache.set(normalizedName, result);
      return result;
    }

    const data: PokeAPIResponse = await response.json();

    // Prefer official artwork, fall back to front_default
    const spriteUrl =
      data.sprites.other['official-artwork'].front_default ||
      data.sprites.front_default ||
      PLACEHOLDER_SPRITE;

    const result: SpriteResult = {
      name: originalName,
      spriteUrl,
      isPlaceholder: spriteUrl === PLACEHOLDER_SPRITE,
    };

    spriteCache.set(normalizedName, result);
    return result;
  } catch {
    // Network error or other failure
    const result: SpriteResult = {
      name: originalName,
      spriteUrl: PLACEHOLDER_SPRITE,
      isPlaceholder: true,
    };
    // Cache the failure
    spriteCache.set(normalizedName, result);
    return result;
  }
}

/**
 * Fetches sprites for multiple Pokemon names.
 *
 * @param pokemonNames - Array of Pokemon names from the TCG log
 * @returns Map of original names to SpriteResults
 */
export async function fetchSprites(
  pokemonNames: string[]
): Promise<Map<string, SpriteResult>> {
  const results = new Map<string, SpriteResult>();
  const uniqueNames = [...new Set(pokemonNames)];

  const spritePromises = uniqueNames.map(async (name) => {
    const result = await fetchSprite(name);
    results.set(name, result);
  });

  await Promise.all(spritePromises);
  return results;
}

/**
 * Clears the sprite cache. Useful for testing.
 */
export function clearSpriteCache(): void {
  spriteCache.clear();
  pendingRequests.clear();
}

/**
 * Gets the current cache size. Useful for testing.
 */
export function getCacheSize(): number {
  return spriteCache.size;
}

/**
 * Checks if a Pokemon is in the cache. Useful for testing.
 */
export function isInCache(pokemonName: string): boolean {
  const normalizedName = normalizePokemonName(pokemonName);
  return spriteCache.has(normalizedName);
}
