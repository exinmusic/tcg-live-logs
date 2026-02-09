/**
 * Event utility functions
 * Shared utilities for event processing
 */

/**
 * Determine if an event is significant (knockout or big attack)
 * Property 12: Significant Event Identification
 */
export function isSignificantEvent(event: { type: string; details: { damage?: number } }): boolean {
  if (event.type === 'knockout') {
    return true
  }
  if (event.type === 'attack' && event.details.damage !== undefined && event.details.damage >= 100) {
    return true
  }
  return false
}
