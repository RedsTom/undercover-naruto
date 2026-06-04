import type { NarutoEntry, Era } from '~/types';

let allEntries: NarutoEntry[] | null = null;
let loaded = false;

function flattenModules(modules: Record<string, any>): NarutoEntry[] {
  const entries: NarutoEntry[] = [];
  for (const path of Object.keys(modules)) {
    const data = modules[path];
    if (Array.isArray(data)) {
      entries.push(...data);
    } else if (data && typeof data === 'object' && 'id' in data) {
      entries.push(data as NarutoEntry);
    }
  }
  return entries;
}

export function getAllEntries(): NarutoEntry[] {
  if (loaded && allEntries) return allEntries;

  const characterModules = import.meta.glob('~/data/naruto/characters/*.json', { eager: true, import: 'default' });
  const techniqueModules = import.meta.glob('~/data/naruto/techniques/*.json', { eager: true, import: 'default' });
  const clanModules = import.meta.glob('~/data/naruto/clans/*.json', { eager: true, import: 'default' });
  const villageModules = import.meta.glob('~/data/naruto/villages/*.json', { eager: true, import: 'default' });
  const bijuuModules = import.meta.glob('~/data/naruto/bijuu/*.json', { eager: true, import: 'default' });
  const orgModules = import.meta.glob('~/data/naruto/organizations/*.json', { eager: true, import: 'default' });
  const kageModules = import.meta.glob('~/data/naruto/kage/*.json', { eager: true, import: 'default' });
  const kgModules = import.meta.glob('~/data/naruto/kekkei-genkai/*.json', { eager: true, import: 'default' });
  const itemModules = import.meta.glob('~/data/naruto/items/*.json', { eager: true, import: 'default' });

  allEntries = [
    ...flattenModules(characterModules),
    ...flattenModules(techniqueModules),
    ...flattenModules(clanModules),
    ...flattenModules(villageModules),
    ...flattenModules(bijuuModules),
    ...flattenModules(orgModules),
    ...flattenModules(kageModules),
    ...flattenModules(kgModules),
    ...flattenModules(itemModules),
  ];

  loaded = true;
  return allEntries;
}

export function getEntryByName(name: string): NarutoEntry | undefined {
  return getAllEntries().find(e => e.name === name);
}

export function getEntriesByCategory(category: string): NarutoEntry[] {
  return getAllEntries().filter(e => e.category === category);
}

export function getEntriesByEra(era: string): NarutoEntry[] {
  return getAllEntries().filter(e => e.era.includes(era));
}

export function getEntriesByTags(tags: string[]): NarutoEntry[] {
  return getAllEntries().filter(e =>
    tags.some(t => e.tags.includes(t))
  );
}