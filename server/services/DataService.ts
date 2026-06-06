import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AnimeEntry, AnimeManifest } from '~/types';

interface CachedAnime {
  entries: AnimeEntry[];
  manifest: AnimeManifest;
}

const cache = new Map<string, CachedAnime>();

function getDataDir(anime: string): string {
  return join(process.cwd(), 'data', anime);
}

export function loadManifest(anime: string): AnimeManifest | null {
  const manifestPath = join(getDataDir(anime), 'manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf-8')) as AnimeManifest;
  } catch {
    return null;
  }
}

export function listAvailableAnime(): Array<{ slug: string; name: string; color: string }> {
  const dataRoot = join(process.cwd(), 'data');
  if (!existsSync(dataRoot)) return [];

  const results: Array<{ slug: string; name: string; color: string }> = [];
  const dirs = readdirSync(dataRoot, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const manifestPath = join(dataRoot, dir.name, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as AnimeManifest;
      results.push({ slug: dir.name, name: manifest.name, color: manifest.color });
    } catch {}
  }

  return results;
}

function loadAnimeData(anime: string): CachedAnime | null {
  if (cache.has(anime)) return cache.get(anime)!;

  const manifest = loadManifest(anime);
  if (!manifest) return null;

  const entries: AnimeEntry[] = [];
  const baseDir = getDataDir(anime);

  const subDirs = readdirSync(baseDir, { withFileTypes: true });
  for (const subDir of subDirs) {
    if (!subDir.isDirectory()) continue;
    const dir = join(baseDir, subDir.name);
    const files = readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = readFileSync(join(dir, file), 'utf-8');
        const data = JSON.parse(content) as AnimeEntry;
        entries.push(data);
      } catch (e) {
        console.error(`[DataService] Error loading ${dir}/${file}:`, e);
      }
    }
  }

  const result = { entries, manifest };
  cache.set(anime, result);
  return result;
}

export function loadAllEntries(anime: string): AnimeEntry[] {
  const data = loadAnimeData(anime);
  return data?.entries ?? [];
}

export function getEntryByName(anime: string, name: string): AnimeEntry | undefined {
  return loadAllEntries(anime).find(e => e.name === name);
}

export function getEntriesByEras(anime: string, eras: string[]): AnimeEntry[] {
  if (eras.length === 0) return loadAllEntries(anime);
  return loadAllEntries(anime).filter(e =>
    e.era.some(era => eras.includes(era))
  );
}

export function getTagOverlap(a: AnimeEntry, b: AnimeEntry): number {
  const setB = new Set(b.tags);
  return a.tags.filter(t => setB.has(t)).length;
}

export interface WordPairCandidate {
  wordA: string;
  wordB: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  overlap: number;
}

export function generateWordPairs(anime: string, eras: string[], minOverlap = 3, excludeKeys: Set<string> = new Set()): WordPairCandidate[] {
  const entries = getEntriesByEras(anime, eras);
  const pairs: WordPairCandidate[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];

      if (a.category !== b.category) continue;

      const overlap = getTagOverlap(a, b);

      if (overlap >= minOverlap) {
        const key = [a.name, b.name].sort().join(':');
        if (seen.has(key) || excludeKeys.has(key)) continue;
        seen.add(key);

        let difficulty: 'easy' | 'medium' | 'hard';
        if (overlap >= 6) difficulty = 'easy';
        else if (overlap >= 4) difficulty = 'medium';
        else difficulty = 'hard';

        pairs.push({
          wordA: a.name,
          wordB: b.name,
          difficulty,
          category: a.category,
          overlap,
        });
      }
    }
  }

  return pairs;
}

export function getRandomWordPair(anime: string, eras: string[], minOverlap = 3, difficulty?: 'easy' | 'medium' | 'hard', excludeKeys: Set<string> = new Set()): WordPairCandidate | null {
  const pairs = generateWordPairs(anime, eras, minOverlap, excludeKeys);

  const filtered = difficulty
    ? pairs.filter(p => p.difficulty === difficulty)
    : pairs;

  if (filtered.length === 0) {
    if (pairs.length > 0) {
      const shuffled = [...pairs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled[0];
    }
    return null;
  }

  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled[0];
}