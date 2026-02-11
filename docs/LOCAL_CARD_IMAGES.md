# Local Card Images

This project supports loading card images from a local manifest instead of always fetching from the Pokemon TCG API. This improves performance and reduces API calls.

## How It Works

1. **Download Script**: The `download-card-images.js` script downloads card images and creates a manifest with a lookup index
2. **Manifest Structure**: The manifest includes:
   - `cards`: Array of all downloaded cards with metadata
   - `byName`: Lookup index mapping normalized card names to their images (sorted by release date)
3. **Auto-Loading**: The app automatically checks for local images before fetching from the API

## Manifest Structure

```json
{
  "version": 2,
  "downloadedAt": "2026-02-11T06:40:44.786Z",
  "cards": [
    {
      "id": "me1-1",
      "name": "Bulbasaur",
      "set": "Mega Evolution",
      "setId": "me1",
      "releaseDate": "2025-01-15",
      "filename": "me1-1.png"
    }
  ],
  "byName": {
    "bulbasaur": [
      {
        "id": "me1-1",
        "filename": "me1-1.png",
        "set": "Mega Evolution",
        "setId": "me1",
        "releaseDate": "2025-01-15"
      }
    ]
  }
}
```

## Usage

### Download Card Images

```bash
# Download recent sets
npm run download:recent

# Download specific set
npm run download:set sv10

# Download multiple sets
node scripts/download-card-images.js --sets me2,me1,sv10

# Download specific cards
npm run download:cards "Pikachu,Charizard,Mewtwo"
```

### Rebuild Manifest

If you have images but need to regenerate the lookup index:

```bash
npm run rebuild:manifest
```

### Using in Code

The app automatically uses local images when available. You can also use the API directly:

```typescript
import { getLocalCardImage, hasLocalCardImage, getManifestStats } from './api/localCardImages'

// Check if card is available locally
const hasLocal = await hasLocalCardImage('Pikachu')

// Get local image URL (returns most recent version)
const imageUrl = await getLocalCardImage('Pikachu')

// Get all versions of a card
const allVersions = await getAllLocalCardImages('Pikachu')

// Get manifest statistics
const stats = await getManifestStats()
console.log(`${stats.totalCards} cards, ${stats.uniqueNames} unique names`)
```

## Card Name Normalization

Card names are normalized for lookup by:
1. Converting to lowercase
2. Removing all non-alphanumeric characters

Examples:
- "Pikachu ex" → "pikachuex"
- "Boss's Orders" → "bossorders"
- "Mega Venusaur ex" → "megavenusaurex"

## Multiple Versions

When multiple versions of a card exist (e.g., from different sets), the manifest stores all versions sorted by release date. The `getLocalCardImage()` function returns the most recent version by default.

## Integration with Card Fetcher

The `cardFetcher.ts` service automatically checks for local images before fetching from the API:

1. Check local manifest first
2. If found, use local image URL
3. If not found, fetch from Pokemon TCG API
4. Cache the result for future use

This provides a seamless experience where local images are used when available, with automatic fallback to the API.
