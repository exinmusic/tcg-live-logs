/**
 * Trainer card categorization for Pokemon TCG Live logs
 */

import type { TrainerCategory } from '../types'

/**
 * Known trainer card mappings based on the design document
 */
export const TRAINER_CATEGORIES: Record<string, TrainerCategory> = {
  // Supporters - draw cards, search, or have major effects
  Arven: 'supporter',
  Hilda: 'supporter',
  Iono: 'supporter',
  "Boss's Orders": 'supporter',
  "Professor's Research": 'supporter',
  "Lillie's Determination": 'supporter',
  Dawn: 'supporter',
  "Xerosic's Machinations": 'supporter',
  Cynthia: 'supporter',
  Marnie: 'supporter',
  "Professor Sada's Vitality": 'supporter',
  "Professor Turo's Scenario": 'supporter',
  Jacq: 'supporter',
  Judge: 'supporter',
  Penny: 'supporter',
  Tulip: 'supporter',
  Worker: 'supporter',

  // Items - single-use effects
  'Nest Ball': 'item',
  'Ultra Ball': 'item',
  'Rare Candy': 'item',
  'Counter Catcher': 'item',
  'Buddy-Buddy Poffin': 'item',
  'Precious Trolley': 'item',
  'Redeemable Ticket': 'item',
  'Sacred Ash': 'item',
  'Switch': 'item',
  'Escape Rope': 'item',
  'Super Rod': 'item',
  'Level Ball': 'item',
  'Quick Ball': 'item',
  'Great Ball': 'item',
  'Pokégear 3.0': 'item',
  'Energy Search': 'item',
  'Energy Retrieval': 'item',
  'Earthen Vessel': 'item',
  'Battle VIP Pass': 'item',
  'Capturing Aroma': 'item',
  'Pal Pad': 'item',
  'Hisuian Heavy Ball': 'item',
  'Lost Vacuum': 'item',
  'Canceling Cologne': 'item',
  'Defiance Band': 'item',
  'Choice Belt': 'item',
  'Exp. Share': 'item',
  'Forest Seal Stone': 'item',
  'Technical Machine: Evolution': 'item',
  'Technical Machine: Devolution': 'item',
  'Prime Catcher': 'item',
  'Night Stretcher': 'item',
  'Pokémon Catcher': 'item',
  'Max Potion': 'item',
  'Potion': 'item',
  'Super Potion': 'item',

  // Tools - attach to Pokemon
  'Gravity Gemstone': 'tool',
  'Air Balloon': 'tool',
  'Cape of Toughness': 'tool',
  'Big Charm': 'tool',
  'Rescue Scarf': 'tool',
  'Tool Jammer': 'tool',
  'Tool Scrapper': 'item', // This is actually an item that removes tools
  'Hero\'s Cape': 'tool',
  'Bravery Charm': 'tool',
  'Rocky Helmet': 'tool',
  'Leftovers': 'tool',

  // Stadiums - affect the field
  Artazon: 'stadium',
  'Surfing Beach': 'stadium',
  'Path to the Peak': 'stadium',
  'Temple of Sinnoh': 'stadium',
  'Collapsed Stadium': 'stadium',
  'Beach Court': 'stadium',
  'Magenta Plaza': 'stadium',
  'Mesagoza': 'stadium',
  'Lost City': 'stadium',
  'Tower of Waters': 'stadium',
  'Tower of Darkness': 'stadium',
  'Training Court': 'stadium',
  'Jubilife Village': 'stadium',
  'Pokémon League Headquarters': 'stadium',
  'Iono\'s Voltorb': 'stadium',
}

/**
 * Patterns that indicate a card is likely a supporter
 * (used for inference when card is not in known list)
 */
const SUPPORTER_PATTERNS = [
  /drew \d+ cards/i,
  /shuffled.*deck/i,
  /search.*deck/i,
  /opponent.*shuffle/i,
]

/**
 * Patterns that indicate a card is likely an item
 */
const ITEM_PATTERNS = [
  /ball$/i,
  /catcher$/i,
  /^switch$/i,
  /rope$/i,
  /rod$/i,
  /ash$/i,
  /ticket$/i,
  /trolley$/i,
  /poffin$/i,
  /candy$/i,
]

/**
 * Patterns that indicate a card is likely a tool
 */
const TOOL_PATTERNS = [
  /gemstone$/i,
  /balloon$/i,
  /charm$/i,
  /cape$/i,
  /scarf$/i,
  /belt$/i,
  /helmet$/i,
  /stone$/i,
]

/**
 * Get the category for a trainer card
 * First checks known mappings, then uses inference
 */
export function getTrainerCategory(trainerName: string): TrainerCategory {
  // Check known mappings first
  if (trainerName in TRAINER_CATEGORIES) {
    return TRAINER_CATEGORIES[trainerName]
  }

  // Try to infer from name patterns
  const normalizedName = trainerName.toLowerCase()

  // Check tool patterns first (most specific)
  for (const pattern of TOOL_PATTERNS) {
    if (pattern.test(normalizedName)) {
      return 'tool'
    }
  }

  // Check item patterns
  for (const pattern of ITEM_PATTERNS) {
    if (pattern.test(normalizedName)) {
      return 'item'
    }
  }

  // Check if it looks like a person's name (likely supporter)
  // Supporters are often named after characters
  if (/^[A-Z][a-z]+('s)?(\s+[A-Z][a-z]+)*$/.test(trainerName)) {
    return 'supporter'
  }

  // Default to item for unknown trainers
  return 'item'
}

/**
 * Infer trainer category based on the effect described in the log
 * This is used when we see the effect of a trainer card
 */
export function inferCategoryFromEffect(effectLine: string): TrainerCategory | null {
  for (const pattern of SUPPORTER_PATTERNS) {
    if (pattern.test(effectLine)) {
      return 'supporter'
    }
  }

  // Stadium effects typically mention "Stadium spot"
  if (/stadium spot/i.test(effectLine)) {
    return 'stadium'
  }

  // Tool effects typically mention "attached to"
  if (/attached.*to/i.test(effectLine)) {
    return 'tool'
  }

  return null
}

/**
 * Check if a card name is a known trainer
 */
export function isKnownTrainer(trainerName: string): boolean {
  return trainerName in TRAINER_CATEGORIES
}

/**
 * Get all known trainers of a specific category
 */
export function getTrainersByCategory(category: TrainerCategory): string[] {
  return Object.entries(TRAINER_CATEGORIES)
    .filter(([, cat]) => cat === category)
    .map(([name]) => name)
}
