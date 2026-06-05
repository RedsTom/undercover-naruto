import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { NarutoEntry } from '~/types';

const CATEGORIES = [
  'characters', 'techniques', 'clans', 'villages', 'bijuu',
  'organizations', 'kage', 'kekkei-genkai', 'items',
];

let cachedEntries: NarutoEntry[] | null = null;

function getDataDir(): string {
  return join(process.cwd(), 'data', 'naruto');
}

export function loadAllEntries(): NarutoEntry[] {
  if (cachedEntries) return cachedEntries;

  const entries: NarutoEntry[] = [];
  const baseDir = getDataDir();

  for (const category of CATEGORIES) {
    const dir = join(baseDir, category);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = readFileSync(join(dir, file), 'utf-8');
        const data = JSON.parse(content) as NarutoEntry;
        entries.push(data);
      } catch (e) {
        console.error(`[DataService] Error loading ${dir}/${file}:`, e);
      }
    }
  }

  cachedEntries = entries;
  return entries;
}

export function getEntryByName(name: string): NarutoEntry | undefined {
  return loadAllEntries().find(e => e.name === name);
}

export function getEntriesByEras(eras: string[]): NarutoEntry[] {
  if (eras.length === 0) return loadAllEntries();
  return loadAllEntries().filter(e =>
    e.era.some(era => eras.includes(era))
  );
}

export function getTagOverlap(a: NarutoEntry, b: NarutoEntry): number {
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

export function generateWordPairs(eras: string[], minOverlap = 3, excludeKeys: Set<string> = new Set()): WordPairCandidate[] {
  const entries = getEntriesByEras(eras);
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

export function getRandomWordPair(eras: string[], minOverlap = 3, difficulty?: 'easy' | 'medium' | 'hard', excludeKeys: Set<string> = new Set()): WordPairCandidate | null {
  const pairs = generateWordPairs(eras, minOverlap, excludeKeys);

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
