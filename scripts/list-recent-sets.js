#!/usr/bin/env node

/**
 * List recent Pokemon TCG sets
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.POKEMONTCG_API_KEY || process.env.VITE_POKEMONTCG_API_KEY;

async function listRecentSets() {
  console.log('🎴 Recent Pokemon TCG Sets\n');
  
  const headers = {};
  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  }
  
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets', { headers });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`);
    }
    
    const data = await response.json();
    
    // Sort by release date (newest first)
    const sorted = data.data.sort((a, b) => {
      return (b.releaseDate || '').localeCompare(a.releaseDate || '');
    });
    
    // Show last 20 sets
    console.log('ID'.padEnd(15) + 'Name'.padEnd(45) + 'Release Date'.padEnd(15) + 'Cards');
    console.log('─'.repeat(85));
    
    sorted.slice(0, 20).forEach(set => {
      const id = set.id.padEnd(15);
      const name = set.name.padEnd(45);
      const date = (set.releaseDate || 'Unknown').padEnd(15);
      const total = set.total || set.printedTotal || '?';
      console.log(`${id}${name}${date}${total}`);
    });
    
    console.log('\n💡 To download a set:');
    console.log('   node scripts/download-card-images.js --set sv8pt5');
    console.log('\n💡 To download multiple sets:');
    console.log('   node scripts/download-card-images.js --sets sv8,sv8pt5,sv7,sv6');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listRecentSets();
