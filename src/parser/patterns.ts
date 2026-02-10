/**
 * Regex patterns for parsing Pokemon TCG Live game logs
 * Note: Some patterns use [''\u2019] to match both ASCII apostrophe (') and
 * Unicode right single quotation mark (') which appears in some game logs.
 */

export const PATTERNS = {
  // Setup phase
  coinFlipChoice: /^(\w+) chose (heads|tails) for the opening coin flip/,
  coinFlipWinner: /^(\w+) won the coin toss/,
  goFirst: /^(\w+) decided to go (first|second)/,
  openingHand: /^(\w+) drew (\d+) cards for the opening hand/,
  mulligan: /^(\w+) took a mulligan/,
  mulliganDraw: /^(\w+) drew (\d+) more cards? because (\w+) took at least 1 mulligan/,

  // Turn markers
  turnStart: /^\[playerName\]'s Turn$/,

  // Draw actions
  drewCard: /^(\w+) drew ([A-Z][^.]+)\.?$/, // Must start with capital letter to avoid "a card"
  drewCards: /^(\w+) drew (\d+) cards/,

  // Pokemon actions
  playedPokemon: /^(\w+) played ([A-Z][^.]+?) to the (Active Spot|Bench)/, // Must start with capital letter
  evolved: /^(\w+) evolved (.+?) to (.+?)(?:(?: in the Active Spot| on the Bench)?\.?)?$/,
  switchedIn: /^(\w+)['\u2019]s (.+?) is now in the Active Spot/,

  // Energy and tool attachment
  attachedEnergy: /^(\w+) attached (.+?) to (.+?)(?: in the Active Spot| on the Bench)?\.?$/,

  // Trainer cards
  playedTrainer: /^(\w+) played (.+?)(?:\.|$)/,
  playedStadium: /^(\w+) played (.+?) to the Stadium spot/,

  // Abilities
  usedAbility: /^(\w+)['\u2019]s (.+?) used (.+?)\.?$/,

  // Combat
  attack: /^(\w+)['\u2019]s (.+?) used (.+?) on (\w+)['\u2019]s (.+?) for (\d+) damage/,
  knockout: /^(\w+)['\u2019]s (.+?) was Knocked Out/,
  prizeTaken: /^(\w+) took a Prize card/,

  // Coin flips
  coinFlip: /flipped (\d+) coins?, and (\d+) landed on heads/,

  // Win conditions
  deckOut: /^Opponent['\u2019]s deck ran out of cards\. (\w+) wins/,
  prizeWin: /^(\w+) took all Prize cards/,
  noPokemon: /^(\w+) has no Pokémon in play\. (\w+) wins/,
  concede: /^(\w+) conceded/,

  // Damage breakdown
  damageBreakdown: /^- Damage breakdown:/,

  // Helper patterns for parsing details
  cardList: /^[ ]{3}• (.+)$/,
  drewAndPlayed: /drew (.+?) and played (?:it|them) to the Bench/,
  drewSpecificCard: /drew (\w+(?:\s+\w+)*) and played it to the Bench/,
} as const

/**
 * Lines to skip during parsing (metadata, card lists, etc.)
 */
export const SKIP_PATTERNS = [
  /^- \d+ drawn cards/,
  /^- Cards revealed from Mulligan/,
  /^- .+ drew a card\.$/,
  /^- .+ drew .+ and played/,  // Skip "drew X and played it to the Bench" metadata lines
  /^A card was added to .+['\u2019]s hand/,
  /^- .+ shuffled/,
  /^- .+ put \d+ cards/,
  /^- .+ moved .+ cards to/,
  /^- .+ discarded/,
  /^- \d+ cards were discarded/,
  /^[ ]{3}•/,
  /^Damage breakdown:/,
  /^- Damage breakdown:/,
  /^\s*$/,
] as const
