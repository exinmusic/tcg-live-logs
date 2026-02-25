/**
 * PixelIcon Component
 * Maps event types and actions to pixel art icons
 */

import {
  Card,
  Target,
  ArrowUp,
  Zap,
  Clipboard,
  Sparkles,
  Sword,
  Minus,
  Trophy,
  Reload,
  Coins,
  Crown,
  WarningDiamond,
  InfoBox,
  Smile,
} from 'pixelarticons/react'

export type IconType =
  | 'draw'
  | 'play_pokemon'
  | 'evolve'
  | 'attach_energy'
  | 'play_trainer'
  | 'use_ability'
  | 'attack'
  | 'knockout'
  | 'prize_taken'
  | 'switch'
  | 'coin_flip'
  | 'mulligan'
  | 'win'
  | 'winner'
  | 'damage'
  | 'turns'
  | 'warning'
  | 'significant'
  | 'info'
  | 'smile'

interface PixelIconProps {
  type: IconType
  size?: number
  className?: string
  title?: string
}

export function PixelIcon({ type, size = 24, className = '', title }: PixelIconProps) {
  const props = {
    width: size,
    height: size,
    className,
    title,
    'aria-hidden': !title,
  }

  switch (type) {
    case 'draw':
      return <Card {...props} />
    case 'play_pokemon':
      return <Target {...props} />
    case 'evolve':
      return <ArrowUp {...props} />
    case 'attach_energy':
    case 'significant':
      return <Zap {...props} />
    case 'play_trainer':
      return <Clipboard {...props} />
    case 'use_ability':
      return <Sparkles {...props} />
    case 'attack':
    case 'damage':
      return <Sword {...props} />
    case 'knockout':
      return <Minus {...props} />
    case 'prize_taken':
    case 'winner':
      return <Trophy {...props} />
    case 'switch':
    case 'turns':
    case 'mulligan':
      return <Reload {...props} />
    case 'coin_flip':
      return <Coins {...props} />
    case 'win':
      return <Crown {...props} />
    case 'warning':
      return <WarningDiamond {...props} />
    case 'info':
      return <InfoBox {...props} />
    case 'smile':
      return <Smile {...props} />
    default:
      return <span {...props}>•</span>
  }
}

export default PixelIcon
