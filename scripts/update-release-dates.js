#!/usr/bin/env node

/**
 * Update Release Dates Script
 * Updates the manifest.json with correct release dates based on set information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '..', 'public', 'card-images', 'manifest.json');

// Set name to release date mapping
const SET_RELEASE_DATES = {
  "Mega Evolution—Perfect Order": "2026/03/27",
  "Mega Evolution—Ascended Heroes": "2026/01/30",
  "Mega Evolution—Phantasmal Flames": "2025/11/14",
  "Mega Evolution": "2025/09/26",
  "Scarlet & Violet—White Flare": "2025/07/18",
  "Scarlet & Violet—Black Bolt": "2025/07/18",
  "Scarlet & Violet—Destined Rivals": "2025/05/30",
  "Scarlet & Violet—Journey Together": "2025/03/28",
  "Scarlet & Violet—Prismatic Evolutions": "2025/01/17",
  "Scarlet & Violet—Surging Sparks": "2024/11/08",
  "Scarlet & Violet—Stellar Crown": "2024/09/13",
  "Scarlet & Violet—Shrouded Fable": "2024/08/02",
  "Scarlet & Violet—Twilight Masquerade": "2024/05/24",
  "Scarlet & Violet—Temporal Forces": "2024/03/22",
  "Scarlet & Violet—Paldean Fates": "2024/01/26",
  "Scarlet & Violet—Paradox Rift": "2023/11/03",
  "Scarlet & Violet—151": "2023/09/22",
  "Scarlet & Violet—Obsidian Flames": "2023/08/11",
  "Scarlet & Violet—Paldea Evolved": "2023/06/09",
  "Scarlet & Violet": "2023/03/31",
  "Crown Zenith": "2023/01/20",
  "Sword & Shield—Silver Tempest": "2022/11/11",
  "Sword & Shield—Lost Origin": "2022/09/09",
  "Pokémon GO": "2022/07/01",
  "Sword & Shield—Astral Radiance": "2022/05/27",
  "Sword & Shield—Brilliant Stars": "2022/02/25",
  "Sword & Shield—Fusion Strike": "2021/11/12",
  "Celebrations": "2021/10/08",
  "Sword & Shield—Evolving Skies": "2021/08/27",
  "Sword & Shield—Chilling Reign": "2021/06/18",
  "Sword & Shield—Battle Styles": "2021/03/19",
  "Shining Fates": "2021/02/19",
  "Sword & Shield—Vivid Voltage": "2020/11/13",
  "Champion's Path": "2020/09/25",
  "Sword & Shield—Darkness Ablaze": "2020/08/14",
  "Sword & Shield—Rebel Clash": "2020/05/01",
  "Sword & Shield": "2020/02/07",
  "Sun & Moon—Cosmic Eclipse": "2019/11/01",
  "Hidden Fates": "2019/08/23",
  "Sun & Moon—Unified Minds": "2019/08/02",
  "Sun & Moon—Unbroken Bonds": "2019/05/03",
  "Detective Pikachu": "2019/03/29",
  "Sun & Moon—Team Up": "2019/02/01",
  "Sun & Moon—Lost Thunder": "2018/11/02",
  "Dragon Majesty": "2018/09/07",
  "Sun & Moon—Celestial Storm": "2018/08/03",
  "Sun & Moon—Forbidden Light": "2018/05/04",
  "Sun & Moon—Ultra Prism": "2018/02/02",
  "Sun & Moon—Crimson Invasion": "2017/11/03",
  "Shining Legends": "2017/10/06",
  "Sun & Moon—Burning Shadows": "2017/08/04",
  "Sun & Moon—Guardians Rising": "2017/05/05",
  "Sun & Moon": "2017/02/03",
  "XY—Evolutions": "2016/11/02",
  // Abbreviated set codes
  "MEW": "2023/09/22", // Scarlet & Violet—151 (MEW = Mew set)
  "OBF": "2023/08/11", // Obsidian Flames
  "PAL": "2023/06/09", // Paldea Evolved
  "PAR": "2023/11/03", // Paradox Rift
  "SVI": "2023/03/31", // Scarlet & Violet base
  "SVE": "2023/03/31"  // Scarlet & Violet Energy (same as base set)
};

async function updateReleaseDates() {
  console.log('📅 Updating release dates in manifest...\n');

  // Check if manifest exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Manifest file not found!');
    console.error(`   Expected at: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  // Load manifest
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`📖 Loaded manifest with ${manifest.cards?.length || 0} cards\n`);
  } catch (error) {
    console.error('❌ Could not parse manifest:', error.message);
    process.exit(1);
  }

  if (!manifest.cards || !Array.isArray(manifest.cards)) {
    console.error('❌ Invalid manifest structure - missing cards array');
    process.exit(1);
  }

  // Update release dates
  let updated = 0;
  let alreadySet = 0;
  let notFound = 0;
  const missingDates = new Set();

  for (const card of manifest.cards) {
    const setName = card.set;
    
    // Skip if already has a valid release date
    if (card.releaseDate && card.releaseDate !== '' && card.releaseDate !== 'NaN') {
      alreadySet++;
      continue;
    }

    // Look up release date
    const releaseDate = SET_RELEASE_DATES[setName];
    
    if (releaseDate) {
      card.releaseDate = releaseDate;
      updated++;
    } else {
      notFound++;
      missingDates.add(setName);
    }
  }

  // Update byName index if it exists
  if (manifest.byName && typeof manifest.byName === 'object') {
    console.log('🔄 Updating byName index...\n');
    
    // Rebuild byName index with updated dates
    Object.keys(manifest.byName).forEach(key => {
      if (Array.isArray(manifest.byName[key])) {
        // Update each entry in the byName array
        manifest.byName[key].forEach(entry => {
          const fullCard = manifest.cards.find(c => c.id === entry.id);
          if (fullCard) {
            entry.releaseDate = fullCard.releaseDate;
          }
        });
        
        // Re-sort by release date (newest first)
        manifest.byName[key].sort((a, b) => {
          return (b.releaseDate || '').localeCompare(a.releaseDate || '');
        });
      }
    });
  }

  // Update downloadedAt timestamp
  manifest.downloadedAt = new Date().toISOString();

  // Save updated manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log('✅ Release dates updated!\n');
  console.log(`   Updated: ${updated}`);
  console.log(`   Already set: ${alreadySet}`);
  console.log(`   Not found: ${notFound}`);
  console.log(`   Total cards: ${manifest.cards.length}\n`);

  if (missingDates.size > 0) {
    console.log('⚠️  Sets without release date mapping:');
    Array.from(missingDates).sort().forEach(setName => {
      console.log(`   - ${setName}`);
    });
    console.log('');
  }

  console.log(`Manifest saved to: ${MANIFEST_PATH}`);
}

updateReleaseDates().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
