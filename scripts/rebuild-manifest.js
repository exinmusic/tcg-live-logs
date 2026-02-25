#!/usr/bin/env node

/**
 * Rebuild Manifest Script
 * Rebuilds the manifest.json from existing card images
 * Useful when you have images but need to regenerate the lookup index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARD_IMAGES_DIR = path.join(__dirname, '..', 'public', 'card-images');

// Normalize card name for lookup
function normalizeCardName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Parse card ID to extract set info
function parseCardId(id) {
  // Format: setId-number (e.g., "me1-1", "sv10-123")
  const match = id.match(/^([a-z0-9]+)-(\d+)$/i);
  if (match) {
    return {
      setId: match[1],
      number: match[2],
    };
  }
  return null;
}

async function rebuildManifest() {
  console.log('🔨 Rebuilding manifest from existing images...\n');
  console.log(`Directory: ${CARD_IMAGES_DIR}\n`);

  // Check if directory exists
  if (!fs.existsSync(CARD_IMAGES_DIR)) {
    console.error('❌ Card images directory not found!');
    process.exit(1);
  }

  // Load existing manifest to preserve card names and metadata
  const manifestPath = path.join(CARD_IMAGES_DIR, 'manifest.json');
  let existingManifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`📖 Loaded existing manifest with ${existingManifest.cards?.length || 0} cards\n`);
    } catch (error) {
      console.warn('⚠️  Could not load existing manifest:', error.message);
    }
  }

  // Create lookup map from existing manifest
  const existingCardsById = new Map();
  if (existingManifest?.cards) {
    existingManifest.cards.forEach(card => {
      existingCardsById.set(card.id, card);
    });
  }

  // Scan directory for PNG files
  const files = fs.readdirSync(CARD_IMAGES_DIR);
  const imageFiles = files.filter(f => f.endsWith('.png'));

  console.log(`Found ${imageFiles.length} image files\n`);

  // Build new manifest
  const manifest = {
    version: 2,
    downloadedAt: new Date().toISOString(),
    cards: [],
    byName: {},
  };

  let processed = 0;
  let missing = 0;

  for (const filename of imageFiles) {
    const id = filename.replace('.png', '');
    const existingCard = existingCardsById.get(id);

    if (existingCard) {
      // Use existing card data
      const cardEntry = {
        id: existingCard.id,
        name: existingCard.name,
        set: existingCard.set,
        setId: existingCard.setId || parseCardId(id)?.setId || 'unknown',
        releaseDate: existingCard.releaseDate || '',
        filename,
      };
      manifest.cards.push(cardEntry);

      // Add to byName index
      const normalized = normalizeCardName(existingCard.name);
      if (!manifest.byName[normalized]) {
        manifest.byName[normalized] = [];
      }
      const indexEntry = {
        id: cardEntry.id,
        filename: cardEntry.filename,
        set: cardEntry.set,
        setId: cardEntry.setId,
        releaseDate: cardEntry.releaseDate,
      };
      manifest.byName[normalized].push(indexEntry);
      
      // For basic energy cards, also add "Basic X Energy" variant
      // (e.g., "Psychic Energy" -> also index as "Basic Psychic Energy")
      if (existingCard.name.match(/^(Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal) Energy$/)) {
        const basicName = `Basic ${existingCard.name}`;
        const basicNormalized = normalizeCardName(basicName);
        if (!manifest.byName[basicNormalized]) {
          manifest.byName[basicNormalized] = [];
        }
        manifest.byName[basicNormalized].push(indexEntry);
      }

      processed++;
    } else {
      // Card not in existing manifest - create minimal entry
      const parsedId = parseCardId(id);
      const cardEntry = {
        id,
        name: `Unknown Card ${id}`,
        set: 'Unknown',
        setId: parsedId?.setId || 'unknown',
        releaseDate: '',
        filename,
      };
      manifest.cards.push(cardEntry);
      missing++;
      console.log(`⚠️  Missing metadata for ${id}`);
    }
  }

  // Sort byName entries by release date (newest first)
  Object.keys(manifest.byName).forEach(key => {
    manifest.byName[key].sort((a, b) => {
      return (b.releaseDate || '').localeCompare(a.releaseDate || '');
    });
  });

  // Save manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n✅ Manifest rebuilt!');
  console.log(`   Processed: ${processed}`);
  console.log(`   Missing metadata: ${missing}`);
  console.log(`   Total cards: ${manifest.cards.length}`);
  console.log(`   Unique names: ${Object.keys(manifest.byName).length}`);
  console.log(`\nManifest saved to: ${manifestPath}`);
}

rebuildManifest().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
