# Scripts

Utility scripts for managing Pokemon TCG card images.

## Quick Start

All scripts can be run using npm scripts or directly with node:

```bash
# List recent sets
npm run list:sets

# Download recent sets
npm run download:recent

# Download a specific set
npm run download:set sv10

# Download specific cards
npm run download:cards "Pikachu,Charizard,Mewtwo"

# Rebuild manifest
npm run rebuild:manifest
```

## Scripts Overview

### 1. list-recent-sets.js

Lists the 20 most recent Pokemon TCG sets with their IDs, names, release dates, and card counts.

**Usage:**
```bash
npm run list:sets
# or
node scripts/list-recent-sets.js
```

**Output:**
```
ID             Name                                         Release Date   Cards
─────────────────────────────────────────────────────────────────────────────────
sv10           Prismatic Evolutions                         2025-01-17     279
sv8pt5         Surging Sparks                               2024-11-08     191
...
```

### 2. download-from-limitless.js

Downloads Pokemon TCG card images from Limitless TCG. Use this when the official Pokemon TCG API is down or for sets not available via API.

**Basic Usage:**
```bash
# Download a specific set
npm run download:limitless SVE
node scripts/download-from-limitless.js --set SVE

# Download multiple sets
node scripts/download-from-limitless.js --sets SVE,SVI,PAL

# Download with specific range
node scripts/download-from-limitless.js --set SVI --start 1 --end 198
```

**Options:**
- `--set <setCode>` - Download all cards from a specific set (e.g., SVE, SVI, PAL)
- `--sets <codes>` - Download from multiple sets (comma-separated)
- `--output <dir>` - Output directory (default: public/card-images)
- `--start <num>` - Start card number (default: 1)
- `--end <num>` - End card number (optional, will auto-detect)
- `--max-attempts <n>` - Max consecutive 404s before stopping (default: 5)

**Common Set Codes:**
- `SVE` - Scarlet & Violet Energy cards
- `SVI` - Scarlet & Violet base set
- `PAL` - Paldea Evolved
- `OBF` - Obsidian Flames
- `PAR` - Paradox Rift

**How it works:**
- Scrapes card pages from limitlesstcg.com
- Auto-detects when a set ends (5 consecutive missing cards)
- Updates the same manifest.json as the API downloader
- Rate limited to 200ms between requests

### 3. download-card-images.js

Downloads Pokemon TCG card images from the official Pokemon TCG API. Creates a manifest.json for fast lookups.

**Basic Usage:**
```bash
# Download a specific set
npm run download:set sv10
node scripts/download-card-images.js --set sv10

# Download multiple sets
node scripts/download-card-images.js --sets sv10,sv9,sv8

# Download specific cards (most recent version)
npm run download:cards "Pikachu,Charizard"
node scripts/download-card-images.js --cards "Pikachu,Charizard"

# Download ALL versions of a card
node scripts/download-card-images.js --cards "Pikachu" --all-versions

# Download recent sets (predefined)
npm run download:recent
```

**Options:**
- `--set <setId>` - Download all cards from a specific set
- `--sets <ids>` - Download from multiple sets (comma-separated)
- `--cards <names>` - Download specific cards by name (comma-separated)
- `--all-versions` - Download all versions of each card (default: most recent only)
- `--all-sets` - Download from ALL sets (WARNING: huge download)
- `--output <dir>` - Output directory (default: public/card-images)
- `--api-key <key>` - Pokemon TCG API key (or use env var)

**API Key:**
Set your API key in `.env`:
```
POKEMONTCG_API_KEY=your-key-here
```

Get a free API key at: https://pokemontcg.io

**Output:**
- Images saved as `{cardId}.png` in `public/card-images/`
- Manifest saved as `public/card-images/manifest.json`

### 4. update-release-dates.js

Updates the manifest.json with correct release dates based on set information. Fixes cards with empty or NaN release dates.

**Usage:**
```bash
npm run update:dates
# or
node scripts/update-release-dates.js
```

**What it does:**
- Loads existing manifest.json
- Updates empty/NaN release dates based on set name
- Updates the byName index with new dates
- Re-sorts entries by release date (newest first)
- Reports which sets are missing date mappings

**When to use:**
- After downloading cards with missing release dates
- When you notice cards showing NaN dates
- After adding new sets to the date mapping

### 5. rebuild-manifest.js

Rebuilds the manifest.json from existing card images. Useful if you manually added images or the manifest got corrupted.

**Usage:**
```bash
npm run rebuild:manifest
# or
node scripts/rebuild-manifest.js
```

**What it does:**
- Scans `public/card-images/` for PNG files
- Preserves existing card metadata from old manifest
- Creates new byName lookup index
- Sorts entries by release date

## Manifest Format

The manifest.json provides fast card lookups:

```json
{
  "version": 2,
  "downloadedAt": "2025-01-17T12:00:00.000Z",
  "cards": [
    {
      "id": "sv10-1",
      "name": "Pikachu",
      "set": "Prismatic Evolutions",
      "setId": "sv10",
      "releaseDate": "2025-01-17",
      "filename": "sv10-1.png"
    }
  ],
  "byName": {
    "pikachu": [
      {
        "id": "sv10-1",
        "filename": "sv10-1.png",
        "set": "Prismatic Evolutions",
        "setId": "sv10",
        "releaseDate": "2025-01-17"
      }
    ]
  }
}
```

## Tips

- Start with `list:sets` to see available sets
- Use `download:recent` to get commonly used sets
- The script skips already downloaded images
- Rate limiting is built-in (100ms between requests)
- Without an API key, rate limits are stricter
- Use `--all-versions` sparingly - some cards have 50+ versions!

## Troubleshooting

**"No API key provided"**
- Set `POKEMONTCG_API_KEY` in your `.env` file
- Or use `--api-key` flag
- Script works without key but with stricter rate limits

**"Request timeout"**
- Network issue or API slowness
- Script has 120 second timeout per request
- Try again or check your connection

**"Missing metadata for card"**
- Card image exists but not in manifest
- Run `rebuild:manifest` to regenerate
- Or re-download the set to get full metadata
