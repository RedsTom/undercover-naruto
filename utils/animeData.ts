import type { AnimeEntry } from '~/types';

const cache = new Map<string, AnimeEntry[]>();

function flattenModules(modules: Record<string, any>): AnimeEntry[] {
  const entries: AnimeEntry[] = [];
  for (const path of Object.keys(modules)) {
    const data = modules[path];
    if (Array.isArray(data)) {
      entries.push(...data);
    } else if (data && typeof data === 'object' && 'id' in data) {
      entries.push(data as AnimeEntry);
    }
  }
  return entries;
}

export function getEntries(anime: string): AnimeEntry[] {
  if (cache.has(anime)) return cache.get(anime)!;

  const modules = import.meta.glob('~/data/**/*.json', { eager: true, import: 'default' });

  const entries: AnimeEntry[] = [];
  for (const [path, data] of Object.entries(modules)) {
    if (path.includes('/manifest.json')) continue;
    const parts = path.split('/');
    const animeSlug = parts[parts.length - 2];
    if (animeSlug !== anime) continue;

    if (Array.isArray(data)) {
      entries.push(...data);
    } else if (data && typeof data === 'object' && 'id' in (data as object)) {
      entries.push(data as AnimeEntry);
    }
  }

  cache.set(anime, entries);
  return entries;
}

export function getEntryByName(anime: string, name: string): AnimeEntry | undefined {
  return getEntries(anime).find(e => e.name === name);
}

export function getEntriesByCategory(anime: string, category: string): AnimeEntry[] {
  return getEntries(anime).filter(e => e.category === category);
}

export function getEntriesByEra(anime: string, era: string): AnimeEntry[] {
  return getEntries(anime).filter(e => e.era.includes(era));
}

export function getEntriesByTags(anime: string, tags: string[]): AnimeEntry[] {
  return getEntries(anime).filter(e =>
    tags.some(t => e.tags.includes(t))
  );
}