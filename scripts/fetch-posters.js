#!/usr/bin/env node

/**
 * Fetch Korean-priority TMDb posters for items in data/items.json
 * Usage:
 *   TMDB_API_KEY=... node scripts/fetch-posters.js
 */

const fs = require('fs/promises');
const path = require('path');

const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  console.error('Missing TMDB_API_KEY environment variable.');
  process.exit(1);
}

const ITEMS_PATH = path.join(__dirname, '..', 'data', 'items.json');
const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

const queryOverrides = {
  'movie-zootopia-1': { query: 'Zootopia', year: 2016 },
  'movie-zootopia-2': { query: 'Zootopia 2', year: 2025 },
  'movie-hoppers': { query: 'Hoppers', year: 2026 },
  'movie-elemental': { query: 'Elemental', year: 2023 },
  'movie-soul': { query: 'Soul', year: 2020 },
  'movie-inside-out-1': { query: 'Inside Out', year: 2015 },
  'movie-inside-out-2': { query: 'Inside Out 2', year: 2024 }
};

async function tmdb(pathname, params = {}) {
  const url = new URL(`${TMDB_API}${pathname}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDb ${pathname} failed (${res.status}): ${text.slice(0, 180)}`);
  }
  return res.json();
}

function scoreResult(result, expectedYear, item) {
  let score = 0;
  const releaseYear = Number((result.release_date || '').slice(0, 4));
  const title = `${result.title || ''} ${result.original_title || ''}`.toLowerCase();

  if (expectedYear && releaseYear === expectedYear) score += 5;
  if (expectedYear && Math.abs(releaseYear - expectedYear) <= 1) score += 3;
  if (title.includes((item.title?.en || '').toLowerCase())) score += 2;
  if (result.poster_path) score += 1;

  return score;
}

function pickPoster(images) {
  if (!images?.posters?.length) return null;

  const ko = images.posters
    .filter((p) => p.iso_639_1 === 'ko')
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0));
  if (ko[0]?.file_path) return ko[0].file_path;

  const langless = images.posters
    .filter((p) => p.iso_639_1 === null)
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0));
  if (langless[0]?.file_path) return langless[0].file_path;

  const any = images.posters.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  return any[0]?.file_path || null;
}

async function findMovie(item) {
  const override = queryOverrides[item.id] || {};
  const query = override.query || item.title?.ko || item.title?.en;
  const year = override.year || item.year;

  const search = await tmdb('/search/movie', {
    query,
    language: 'ko-KR',
    include_adult: false,
    page: 1,
    year
  });

  if (!search.results?.length) return null;

  const best = search.results
    .slice(0, 8)
    .sort((a, b) => scoreResult(b, year, item) - scoreResult(a, year, item))[0];

  return best || null;
}

async function main() {
  const raw = await fs.readFile(ITEMS_PATH, 'utf8');
  const items = JSON.parse(raw);

  for (const item of items) {
    if (item.category !== 'movie') continue;

    try {
      const found = await findMovie(item);
      if (!found) {
        console.warn(`No TMDb match for: ${item.id}`);
        continue;
      }

      const images = await tmdb(`/movie/${found.id}/images`, {
        include_image_language: 'ko,null'
      });

      const filePath = pickPoster(images) || found.poster_path;
      if (!filePath) {
        console.warn(`No poster for: ${item.id} (tmdb:${found.id})`);
        continue;
      }

      item.image = `${TMDB_IMAGE_BASE}${filePath}`;
      item.tmdb = {
        id: found.id,
        url: `https://www.themoviedb.org/movie/${found.id}`,
        source: 'TMDB'
      };

      console.log(`Updated ${item.id} -> tmdb:${found.id}`);
    } catch (err) {
      console.warn(`Failed ${item.id}: ${err.message}`);
    }
  }

  await fs.writeFile(ITEMS_PATH, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  console.log('Done: data/items.json updated');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
