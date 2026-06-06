import { getAllEntries } from './narutoData';
import type { NarutoEntry, Era } from '~/types';

export function getWordInfo(name: string): NarutoEntry | undefined {
  return getAllEntries().find(e => e.name === name);
}

export function getWordSummary(name: string): string | null {
  const entry = getWordInfo(name);
  return entry?.summary ?? null;
}

export function getWordDetails(name: string): string[] {
  const entry = getWordInfo(name);
  return entry?.details ?? [];
}

export function getWordEra(name: string): Era[] {
  const entry = getWordInfo(name);
  return entry?.era ?? [];
}

export function getWordTags(name: string): string[] {
  const entry = getWordInfo(name);
  return entry?.tags ?? [];
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    characters: 'Personnage',
    techniques: 'Technique',
    clans: 'Clan',
    villages: 'Village',
    bijuu: 'Bijû',
    organizations: 'Organisation',
    kage: 'Kage',
    'kekkei-genkai': 'Kekkei Genkai',
    items: 'Objet',
  };
  return labels[category] ?? category;
}

export function formatEra(era: Era): string {
  const labels: Record<Era, string> = {
    'naruto': 'Naruto Original',
    'shippuden': 'Shippuden',
    'shippuden-end': 'Fin Shippuden',
    'boruto': 'Boruto',
    'naruto-backstory': 'Flashback',
  };
  return labels[era] ?? era;
}
