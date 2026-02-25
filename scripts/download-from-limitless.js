#!/usr/bin/env node

/**
 * Limitless TCG Card Image Downloader
 * Downloads Pokemon TCG card images from Limitless TCG
 * 
 * Usage:
 *   node scripts/download-from-limitless.js --set SVE
 *   node scripts/download-from-limitless.js --sets SVE,SVI,PAL
 * 
 * Options:
 *   --set <setCode>     Download all cards from a specific set (e.g., "SVE", "SVI", "PAL")
 *   --sets <codes>      Download from multiple sets (comma-separated)
 *   --output <dir>      Output directory (default: public/card-images)
 *   --start <num>       Start card number (default: 1)
 *   --end <num>         End card number (optional, will auto-detect)
 *   --max-attempts <n>  Max consecutive 404s before stopping (default: 5)
 * 
 * Examples:
 *   node scripts/download-from-limitless.js --set SVE
 *   node scripts/download-from-limitless.js --sets SVE,SVI,PAL
 *   node scripts/download-from-limitless.js --set SVI --start 1 --end 198
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'card-images');
const RATE_LIMIT_DELAY = 200; // ms between requests
const MAX_CONSECUTIVE_404 = 5;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    set: null,
    sets: [],
    output: DEFAULT_OUTPUT_DIR,
    start: 1,
    end: null,
    maxAttempts: MAX_CONSECUTIVE_404,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--set':
        options.set = next?.toUpperCase();
        i++;
        break;
      case '--sets':
        options.sets = next.split(',').map(s => s.trim().toUpperCase());
        i++;
        break;
      case '--output':
        options.output = next;
        i++;
        break;
      case '--start':
        options.start = parseInt(next, 10);
        i++;
        break;
      case '--end':
        options.end = parseInt(next, 10);
        i++;
        break;
      case '--max-attempts':
        options.maxAttempts = parseInt(next, 10);
        i++;
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
Limitless TCG Card Image Downloader

Usage:
  node scripts/download-from-limitless.js [options]

Options:
  --set <setCode>     Download all cards from a specific set
  --sets <codes>      Download from multiple sets (comma-separated)
  --output <dir>      Output directory (default: public/card-images)
  --start <num>       Start card number (default: 1)
  --end <num>         End card number (optional, will auto-detect)
  --max-attempts <n>  Max consecutive 404s before stopping (default: 5)

Examples:
  node scripts/download-from-limitless.js --set SVE
  node scripts/download-from-limitless.js --sets SVE,SVI,PAL
  node scripts/download-from-limitless.js --set SVI --start 1 --end 198
  `);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch card page and extract image URL and card info
async function fetchCardInfo(setCode, cardNum) {
  const url = `https://limitlesstcg.com/cards/${setCode}/${cardNum}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract large image URL
    const imageUrl = $('img[src*="EN.png"]').attr('src') || 
                     $('img[src*="EN_LG.png"]').attr('src');
    
    if (!imageUrl) {
      return null;
    }
    
    // Extract card name from title or page
    const title = $('title').text();
    const cardName = title.split(' - ')[0]?.trim() || `Card ${cardNum}`;
    
    return {
      name: cardName,
      imageUrl,
      number: cardNum,
      setCode,
    };
  } catch (error) {
    return null;
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

// Normalize card name for lookup
function normalizeCardName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Download cards from a set
async function downloadSet(setCode, options) {
  console.log(`\n📦 Downloading set: ${setCode}`);
  
  const outputDir = options.output;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load existing manifest
  const manifestPath = path.join(outputDir, 'manifest.json');
  let manifest = {
    version: 2,
    downloadedAt: new Date().toISOString(),
    cards: [],
    byName: {},
  };

  if (fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (existing.cards) {
        manifest.cards = existing.cards;
        manifest.byName = existing.byName || {};
      }
    } catch (error) {
      console.warn('⚠️  Could not load existing manifest:', error.message);
    }
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let consecutive404 = 0;
  let cardNum = options.start;

  while (true) {
    // Stop if we've hit the end number
    if (options.end && cardNum > options.end) {
      break;
    }

    // Stop if we've had too many consecutive 404s
    if (consecutive404 >= options.maxAttempts) {
      console.log(`\n⏹️  Stopping after ${consecutive404} consecutive missing cards`);
      break;
    }

    const cardId = `${setCode.toLowerCase()}-${cardNum}`;
    const filename = `${cardId}.png`;
    const filepath = path.join(outputDir, filename);

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${setCode} #${cardNum} - already exists`);
      skipped++;
      cardNum++;
      consecutive404 = 0;
      continue;
    }

    // Fetch card info
    console.log(`🔍 Fetching ${setCode} #${cardNum}...`);
    const cardInfo = await fetchCardInfo(setCode, cardNum);
    
    if (!cardInfo) {
      console.log(`❌ Card ${setCode} #${cardNum} not found`);
      failed++;
      consecutive404++;
      cardNum++;
      await sleep(RATE_LIMIT_DELAY);
      continue;
    }

    consecutive404 = 0;

    try {
      console.log(`⬇️  Downloading ${cardInfo.name} (${setCode} #${cardNum})...`);
      await downloadImage(cardInfo.imageUrl, filepath);
      downloaded++;

      // Add to manifest
      const cardEntry = {
        id: cardId,
        name: cardInfo.name,
        set: setCode,
        setId: setCode.toLowerCase(),
        releaseDate: '',
        filename,
      };
      manifest.cards.push(cardEntry);

      // Add to byName index
      const normalized = normalizeCardName(cardInfo.name);
      if (!manifest.byName[normalized]) {
        manifest.byName[normalized] = [];
      }
      const indexEntry = {
        id: cardId,
        filename,
        set: setCode,
        setId: setCode.toLowerCase(),
        releaseDate: '',
      };
      manifest.byName[normalized].push(indexEntry);
      
      // For basic energy cards, also add "Basic X Energy" variant
      // (e.g., "Psychic Energy" -> also index as "Basic Psychic Energy")
      if (cardInfo.name.match(/^(Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal) Energy$/)) {
        const basicName = `Basic ${cardInfo.name}`;
        const basicNormalized = normalizeCardName(basicName);
        if (!manifest.byName[basicNormalized]) {
          manifest.byName[basicNormalized] = [];
        }
        manifest.byName[basicNormalized].push(indexEntry);
      }

      await sleep(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`❌ Failed to download ${setCode} #${cardNum}:`, error.message);
      failed++;
    }

    cardNum++;
  }

  // Update manifest
  manifest.downloadedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return { downloaded, skipped, failed };
}

// Main function
async function main() {
  const options = parseArgs();

  console.log('🎴 Limitless TCG Card Image Downloader\n');
  console.log(`Output directory: ${options.output}\n`);

  const setsToDownload = options.set ? [options.set] : options.sets;

  if (setsToDownload.length === 0) {
    console.error('❌ No set specified. Use --set or --sets');
    console.log('   Run with --help for usage information');
    process.exit(1);
  }

  let totalDownloaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const setCode of setsToDownload) {
    const stats = await downloadSet(setCode, options);
    totalDownloaded += stats.downloaded;
    totalSkipped += stats.skipped;
    totalFailed += stats.failed;
  }

  console.log('\n✅ Download complete!');
  console.log(`   Downloaded: ${totalDownloaded}`);
  console.log(`   Skipped: ${totalSkipped}`);
  console.log(`   Failed: ${totalFailed}`);
  console.log(`\nImages saved to: ${options.output}`);
  console.log(`Manifest saved to: ${path.join(options.output, 'manifest.json')}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { downloadSet, fetchCardInfo };
