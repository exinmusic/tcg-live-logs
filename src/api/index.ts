/**
 * API module exports
 */

export { normalizePokemonName } from './normalization';
export {
  fetchSprite,
  fetchSprites,
  clearSpriteCache,
  getCacheSize,
  isInCache,
  type SpriteResult,
} from './pokeApiService';
export {
  fetchCard,
  fetchCards,
  clearCardCache,
  getCardCacheSize,
  isCardInCache,
  getCardFromCache,
} from './cardFetcher';
export {
  getLocalCardImage,
  getAllLocalCardImages,
  hasLocalCardImage,
  getManifestStats,
  preloadManifest,
} from './localCardImages';
