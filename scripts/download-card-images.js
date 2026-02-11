#!/usr/bin/env node

/**
 * Card Image Downloader Script
 * Downloads Pokemon TCG card images for offline use
 * 
 * Usage:
 *   node scripts/download-card-images.js [options]
 * 
 * Options:
 *   --set <setId>       Download all cards from a specific set (e.g., "base1", "swsh1")
 *   --sets <ids>        Download from multiple sets (comma-separated)
 *   --all-sets          Download from all available sets (WARNING: This is HUGE)
 *   --cards <names>     Download specific cards by name (comma-separated)
 *   --output <dir>      Output directory (default: public/card-images)
 *   --api-key <key>     Pokemon TCG API key (or use POKEMONTCG_API_KEY env var)
 * 
 * Examples:
 *   node scripts/download-card-images.js --set base1
 *   node scripts/download-card-images.js --sets base1,base2,base3
 *   node scripts/download-card-images.js --cards "Pikachu,Charizard,Mewtwo"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE = 'https://api.pokemontcg.io/v2';
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'card-images');
const RATE_LIMIT_DELAY = 100; // ms between requests
const API_KEY = process.env.POKEMONTCG_API_KEY || process.env.VITE_POKEMONTCG_API_KEY;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    set: null,
    sets: [],
    allSets: false,
    cards: [],
    output: DEFAULT_OUTPUT_DIR,
    apiKey: API_KEY,
    allVersions: false, // New option
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--set':
        options.set = next;
        i++;
        break;
      case '--sets':
        options.sets = next.split(',').map(s => s.trim());
        i++;
        break;
      case '--all-sets':
        options.allSets = true;
        break;
      case '--cards':
        options.cards = next.split(',').map(s => s.trim());
        i++;
        break;
      case '--output':
        options.output = next;
        i++;
        break;
      case '--api-key':
        options.apiKey = next;
        i++;
        break;
      case '--all-versions':
        options.allVersions = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Card Image Downloader Script

Usage:
  node scripts/download-card-images.js [options]

Options:
  --set <setId>       Download all cards from a specific set
  --sets <ids>        Download from multiple sets (comma-separated)
  --all-sets          Download from all available sets (WARNING: HUGE)
  --cards <names>     Download specific cards by name (comma-separated)
  --all-versions      Download ALL versions of each card (default: most recent only)
  --output <dir>      Output directory (default: public/card-images)
  --api-key <key>     Pokemon TCG API key

Examples:
  node scripts/download-card-images.js --set base1
  node scripts/download-card-images.js --sets swsh1,swsh2,swsh3
  node scripts/download-card-images.js --cards "Pikachu,Charizard,Mewtwo"
  node scripts/download-card-images.js --cards "Pikachu" --all-versions
  `);
}

// Make API request
async function apiRequest(endpoint, apiKey) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {};
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120 second timeout
  
  try {
    const response = await fetch(url, { 
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 120 seconds');
    }
    throw error;
  }
}

// Download image from URL
async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

// Sleep for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get all sets
async function getAllSets(apiKey) {
  console.log('Fetching all sets...');
  const response = await apiRequest('/sets', apiKey);
  return response.data;
}

// Get cards from a set
async function getCardsFromSet(setId, apiKey) {
  console.log(`Fetching cards from set: ${setId}...`);
  let allCards = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await apiRequest(`/cards?q=set.id:${setId}&page=${page}&pageSize=250`, apiKey);
    allCards = allCards.concat(response.data);
    hasMore = page < response.totalPages;
    page++;
    await sleep(RATE_LIMIT_DELAY);
  }

  return allCards;
}

// Search for cards by name
async function searchCardsByName(cardName, apiKey, allVersions = false) {
  console.log(`Searching for card: ${cardName}...`);
  
  // Fetch limited results (orderBy is SLOW on the API, so we'll sort client-side)
  const pageSize = allVersions ? 250 : 50; // Fetch 50 to ensure we get recent ones
  
  const response = await apiRequest(`/cards?q=name:"${cardName}"&pageSize=${pageSize}`, apiKey);
  
  // If not requesting all versions, sort and return the newest
  if (!allVersions && response.data && response.data.length > 0) {
    // Sort by release date (newest first) - much faster client-side!
    const sorted = response.data.sort((a, b) => {
      const dateA = a.set?.releaseDate || '';
      const dateB = b.set?.releaseDate || '';
      return dateB.localeCompare(dateA); // Descending
    });
    
    const mostRecent = sorted[0];
    console.log(`  Found ${response.totalCount || response.data.length} version(s), using most recent: ${mostRecent.set.name} (${mostRecent.set.releaseDate})`);
    return [mostRecent];
  }
  
  if (allVersions && response.data && response.data.length > 0) {
    console.log(`  Found ${response.data.length} version(s), downloading all`);
  }
  
  return response.data;
}

// Normalize card name for lookup (lowercase, no special chars)
function normalizeCardName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Download card images
async function downloadCardImages(cards, outputDir) {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load existing manifest if it exists
  const manifestPath = path.join(outputDir, 'manifest.json');
  let manifest = {
    version: 2,
    downloadedAt: new Date().toISOString(),
    cards: [],
    byName: {}, // New: lookup index by normalized name
  };

  // Load existing manifest to preserve data
  if (fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (existing.cards) {
        manifest.cards = existing.cards;
        // Rebuild byName index from existing cards
        existing.cards.forEach(card => {
          const normalized = normalizeCardName(card.name);
          if (!manifest.byName[normalized]) {
            manifest.byName[normalized] = [];
          }
          manifest.byName[normalized].push({
            id: card.id,
            filename: card.filename,
            set: card.set,
            setId: card.setId,
            releaseDate: card.releaseDate,
          });
        });
      }
    } catch (error) {
      console.warn('⚠️  Could not load existing manifest:', error.message);
    }
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const card of cards) {
    const filename = `${card.id}.png`;
    const filepath = path.join(outputDir, filename);

    // Check if card already in manifest
    const existingCard = manifest.cards.find(c => c.id === card.id);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${card.name} (${card.id}) - already exists`);
      skipped++;
      
      // Update manifest entry if not present
      if (!existingCard) {
        const cardEntry = {
          id: card.id,
          name: card.name,
          set: card.set.name,
          setId: card.set.id,
          releaseDate: card.set.releaseDate || '',
          filename,
        };
        manifest.cards.push(cardEntry);
        
        // Add to byName index
        const normalized = normalizeCardName(card.name);
        if (!manifest.byName[normalized]) {
          manifest.byName[normalized] = [];
        }
        manifest.byName[normalized].push({
          id: card.id,
          filename,
          set: card.set.name,
          setId: card.set.id,
          releaseDate: card.set.releaseDate || '',
        });
      }
      continue;
    }

    try {
      const imageUrl = card.images.large || card.images.small;
      if (!imageUrl) {
        console.log(`⚠️  No image URL for ${card.name} (${card.id})`);
        failed++;
        continue;
      }

      console.log(`⬇️  Downloading ${card.name} (${card.id})...`);
      await downloadImage(imageUrl, filepath);
      downloaded++;

      const cardEntry = {
        id: card.id,
        name: card.name,
        set: card.set.name,
        setId: card.set.id,
        releaseDate: card.set.releaseDate || '',
        filename,
      };
      manifest.cards.push(cardEntry);

      // Add to byName index
      const normalized = normalizeCardName(card.name);
      if (!manifest.byName[normalized]) {
        manifest.byName[normalized] = [];
      }
      manifest.byName[normalized].push({
        id: card.id,
        filename,
        set: card.set.name,
        setId: card.set.id,
        releaseDate: card.set.releaseDate || '',
      });

      // Rate limiting
      await sleep(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`❌ Failed to download ${card.name} (${card.id}):`, error.message);
      failed++;
    }
  }

  // Sort byName entries by release date (newest first)
  Object.keys(manifest.byName).forEach(key => {
    manifest.byName[key].sort((a, b) => {
      return (b.releaseDate || '').localeCompare(a.releaseDate || '');
    });
  });

  // Update timestamp
  manifest.downloadedAt = new Date().toISOString();

  // Save manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return { downloaded, skipped, failed, total: cards.length };
}

// Main function
async function main() {
  const options = parseArgs();

  if (!options.apiKey) {
    console.warn('⚠️  No API key provided. Rate limits will be stricter.');
    console.warn('   Set POKEMONTCG_API_KEY env var or use --api-key flag');
  }

  console.log('🎴 Pokemon TCG Card Image Downloader\n');
  console.log(`Output directory: ${options.output}\n`);

  let cards = [];

  try {
    // Download by specific cards
    if (options.cards.length > 0) {
      console.log(`Downloading specific cards: ${options.cards.join(', ')}\n`);
      for (const cardName of options.cards) {
        const results = await searchCardsByName(cardName, options.apiKey, options.allVersions);
        cards = cards.concat(results);
        await sleep(RATE_LIMIT_DELAY);
      }
    }
    // Download by set(s)
    else if (options.set) {
      cards = await getCardsFromSet(options.set, options.apiKey);
    }
    else if (options.sets.length > 0) {
      for (const setId of options.sets) {
        const setCards = await getCardsFromSet(setId, options.apiKey);
        cards = cards.concat(setCards);
      }
    }
    // Download all sets
    else if (options.allSets) {
      console.log('⚠️  WARNING: Downloading ALL sets. This will take a LONG time!\n');
      const sets = await getAllSets(options.apiKey);
      console.log(`Found ${sets.length} sets\n`);
      
      for (const set of sets) {
        console.log(`\n📦 Processing set: ${set.name} (${set.id})`);
        const setCards = await getCardsFromSet(set.id, options.apiKey);
        cards = cards.concat(setCards);
      }
    }
    else {
      console.error('❌ No download target specified. Use --set, --sets, --cards, or --all-sets');
      console.log('   Run with --help for usage information');
      process.exit(1);
    }

    if (cards.length === 0) {
      console.log('No cards found to download.');
      process.exit(0);
    }

    console.log(`\nFound ${cards.length} cards to download\n`);

    // Download images
    const stats = await downloadCardImages(cards, options.output);

    console.log('\n✅ Download complete!');
    console.log(`   Downloaded: ${stats.downloaded}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Total: ${stats.total}`);
    console.log(`\nImages saved to: ${options.output}`);
    console.log(`Manifest saved to: ${path.join(options.output, 'manifest.json')}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { downloadCardImages, getCardsFromSet, searchCardsByName };
