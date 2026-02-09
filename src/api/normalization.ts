/**
 * Normalizes Pokemon names for PokeAPI lookup.
 * Handles TCG-specific suffixes and special characters.
 */

/**
 * Normalizes a Pokemon name for PokeAPI lookup by:
 * - Converting to lowercase
 * - Removing TCG suffixes (ex, mega, gx, v, vmax, vstar)
 * - Removing special characters (keeping only alphanumeric and hyphens)
 * - Trimming whitespace
 *
 * @param name - The Pokemon name from the TCG log
 * @returns A normalized name suitable for PokeAPI lookup
 */
export function normalizePokemonName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .replace(/\s+ex$/i, '') // Remove "ex" suffix
    .replace(/\s+mega$/i, '') // Remove "mega" suffix
    .replace(/\s+gx$/i, '') // Remove "gx" suffix
    .replace(/\s+vstar$/i, '') // Remove "vstar" suffix (before v to avoid partial match)
    .replace(/\s+vmax$/i, '') // Remove "vmax" suffix (before v to avoid partial match)
    .replace(/\s+v$/i, '') // Remove "v" suffix
    .replace(/[^a-z0-9-]/g, '') // Remove special characters, keep alphanumeric and hyphens
    .trim();
}
