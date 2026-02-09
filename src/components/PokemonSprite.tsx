/**
 * PokemonSprite Component
 * Displays Pokemon sprite images with loading and error states
 *
 * Requirements: 5.3, 5.4
 */

import type { PokemonSprite as PokemonSpriteData } from '../types'
import './PokemonSprite.css'

export interface PokemonSpriteProps {
  pokemonName: string
  sprite: PokemonSpriteData | undefined
  size?: 'small' | 'medium' | 'large'
}

const PLACEHOLDER_SPRITE = '/placeholder-pokemon.png'

/**
 * Get size dimensions based on size prop
 */
function getSizeDimensions(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small':
      return 32
    case 'medium':
      return 64
    case 'large':
      return 96
    default:
      return 64
  }
}

export function PokemonSprite({ pokemonName, sprite, size = 'medium' }: PokemonSpriteProps) {
  const dimensions = getSizeDimensions(size)
  const isLoading = sprite?.isLoading ?? false
  const hasError = sprite?.error !== null && sprite?.error !== undefined
  const spriteUrl = sprite?.spriteUrl ?? PLACEHOLDER_SPRITE

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`pokemon-sprite pokemon-sprite--${size} pokemon-sprite--loading`}
        style={{ width: dimensions, height: dimensions }}
        role="img"
        aria-label={`Loading sprite for ${pokemonName}`}
      >
        <div className="pokemon-sprite__loader" aria-hidden="true" />
      </div>
    )
  }

  // Show error state with placeholder
  if (hasError || !spriteUrl || spriteUrl === PLACEHOLDER_SPRITE) {
    return (
      <div
        className={`pokemon-sprite pokemon-sprite--${size} pokemon-sprite--placeholder`}
        style={{ width: dimensions, height: dimensions }}
        role="img"
        aria-label={`Placeholder for ${pokemonName}`}
        title={pokemonName}
      >
        <span className="pokemon-sprite__placeholder-icon" aria-hidden="true">
          🎴
        </span>
      </div>
    )
  }

  // Show sprite image
  return (
    <div
      className={`pokemon-sprite pokemon-sprite--${size}`}
      style={{ width: dimensions, height: dimensions }}
    >
      <img
        src={spriteUrl}
        alt={pokemonName}
        title={pokemonName}
        className="pokemon-sprite__image"
        loading="lazy"
        onError={(e) => {
          // Fallback to placeholder on image load error
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          target.parentElement?.classList.add('pokemon-sprite--placeholder')
        }}
      />
    </div>
  )
}

export default PokemonSprite
