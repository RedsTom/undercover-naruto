import { getEntryByName } from './animeData';
import type { AnimeEntry } from '~/types';

const manifestCache = new Map<string, { name: string; color: string; eras: Array<{ id: string; label: string }>; categories: Record<string, string> }>();

async function loadManifest(anime: string) {
  if (manifestCache.has(anime)) return manifestCache.get(anime)!;

  const modules = import.meta.glob('~/data/*/manifest.json', { eager: true, import: 'default' });
  for (const [path, data] of Object.entries(modules)) {
    const idx = path.indexOf(`/data/`);
    const afterData = idx >= 0 ? path.slice(idx + 6) : '';
    const slug = afterData.split('/')[0];
    if (slug === anime && data && typeof data === 'object') {
      const m = data as any;
      manifestCache.set(anime, m);
      return m;
    }
  }
  return null;
}

export async function getAvailableAnime(): Promise<Array<{ slug: string; name: string; color: string }>> {
  const modules = import.meta.glob('~/data/*/manifest.json', { eager: true, import: 'default' });
  const result: Array<{ slug: string; name: string; color: string }> = [];

  for (const [path, data] of Object.entries(modules)) {
    const idx = path.indexOf(`/data/`);
    const afterData = idx >= 0 ? path.slice(idx + 6) : '';
    const slug = afterData.split('/')[0];
    if (data && typeof data === 'object') {
      const m = data as any;
      result.push({ slug, name: m.name, color: m.color });
      manifestCache.set(slug, m);
    }
  }

  return result;
}

export function getWordInfo(anime: string, name: string): AnimeEntry | undefined {
  return getEntryByName(anime, name);
}

export async function getCategoryLabel(anime: string, category: string): Promise<string> {
  const manifest = await loadManifest(anime);
  return manifest?.categories?.[category] ?? category;
}

export async function getAnimeManifest(anime: string) {
  return loadManifest(anime);
}

export function formatEra(era: string, manifest?: { eras: Array<{ id: string; label: string }> }): string {
  if (manifest) {
    const found = manifest.eras.find(e => e.id === era);
    if (found) return found.label;
  }
  return era;
}