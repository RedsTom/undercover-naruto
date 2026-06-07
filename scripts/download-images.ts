import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const WIKI_URLS: Record<string, string> = {
  naruto: 'https://naruto.fandom.com/api.php',
  'attaque-des-titans': 'https://attackontitan.fandom.com/api.php',
};

interface AnimeEntry {
  id: string;
  name: string;
  image?: string;
  category: string;
  era: string[];
  tags: string[];
  summary: string;
  details: string[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function findAllJsonFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findAllJsonFiles(full));
      } else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

function getEntries(anime: string): { file: string; entry: AnimeEntry }[] {
  const files = findAllJsonFiles(join('data', anime));
  return files.map(file => ({
    file,
    entry: JSON.parse(readFileSync(file, 'utf-8')) as AnimeEntry,
  }));
}

async function getPageImage(title: string, baseUrl: string): Promise<string | null> {
  const url = `${baseUrl}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'UndercoverGame/1.0 (game)' },
    });
    const data = await res.json() as any;
    const pages = data.query?.pages ?? {};
    for (const pageId of Object.keys(pages)) {
      if (pageId === '-1') continue;
      return pages[pageId].thumbnail?.source ?? null;
    }
  } catch {}
  return null;
}

async function searchWikiPage(query: string, baseUrl: string): Promise<string | null> {
  const url = `${baseUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'UndercoverGame/1.0 (game)' },
    });
    const data = await res.json() as any;
    const pages = data.query?.search;
    if (pages && pages.length > 0) {
      return pages[0].title;
    }
  } catch {}
  return null;
}

async function downloadFile(url: string, dest: string): Promise<boolean> {
  try {
    mkdirSync(dirname(dest), { recursive: true });
    const res = await fetch(url, {
      headers: { 'User-Agent': 'UndercoverGame/1.0 (game)' },
    });
    if (!res.ok) return false;
    const buffer = await res.arrayBuffer();
    writeFileSync(dest, Buffer.from(buffer));
    return true;
  } catch {
    return false;
  }
}

function generateNameVariations(name: string): string[] {
  const variants: string[] = [name];

  const withoutParens = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (withoutParens !== name) variants.push(withoutParens);

  const withoutDash = name.replace(/\s*—\s*.*$/, '').trim();
  if (withoutDash !== name && withoutDash !== withoutParens) variants.push(withoutDash);

  const justFrench = name.replace(/—.*$/, '').trim();
  if (justFrench !== name && !variants.includes(justFrench)) variants.push(justFrench);

  return variants;
}

function getImageUrl(entry: AnimeEntry, anime: string): string {
  return `/images/${anime}/${entry.category}/${slugify(entry.name)}.png`;
}

function getImagePath(entry: AnimeEntry, anime: string): string {
  return join('data/images', anime, entry.category, `${slugify(entry.name)}.png`);
}

async function main() {
  const anime = process.argv[2];
  if (!anime || !WIKI_URLS[anime]) {
    console.error(`Usage: bun run scripts/download-images.ts <anime>`);
    console.error(`Available: ${Object.keys(WIKI_URLS).join(', ')}`);
    process.exit(1);
  }

  const baseUrl = WIKI_URLS[anime];
  const entries = getEntries(anime);
  console.log(`Anime: ${anime}, Total entries: ${entries.length}`);

  const todo = entries.filter(({ entry }) => {
    const path = getImagePath(entry, anime);
    return !existsSync(path) || !entry.image;
  });
  console.log(`Entries needing images: ${todo.length}`);

  let downloaded = 0;
  let failed = 0;

  for (const { file, entry } of todo) {
    const imagePath = getImagePath(entry, anime);
    const imageUrl = getImageUrl(entry, anime);

    if (existsSync(imagePath) && !entry.image) {
      entry.image = imageUrl;
      writeFileSync(file, JSON.stringify(entry, null, 2) + '\n');
      console.log(`  ${entry.name} → already downloaded, updating JSON`);
      continue;
    }

    const variants = generateNameVariations(entry.name);
    console.log(`\n  ${entry.name} (${entry.category})`);
    console.log(`    Trying: ${variants.join(', ')}`);

    let thumbnailUrl: string | null = null;
    let foundTitle: string | null = null;

    for (const v of variants) {
      thumbnailUrl = await getPageImage(v, baseUrl);
      if (thumbnailUrl) {
        foundTitle = v;
        break;
      }
    }

    if (!thumbnailUrl) {
      const searchTerm = variants.reduce((a, b) => a.length <= b.length ? a : b);
      foundTitle = await searchWikiPage(searchTerm, baseUrl);
      if (foundTitle && foundTitle !== searchTerm) {
        console.log(`    Wiki found: "${foundTitle}"`);
        thumbnailUrl = await getPageImage(foundTitle, baseUrl);
      }
    }

    if (!thumbnailUrl && entry.category === 'kage') {
      const baseName = entry.name.replace(/\s*—\s*.*$/, '').trim();
      if (baseName !== entry.name) {
        console.log(`    Trying base name: "${baseName}"`);
        thumbnailUrl = await getPageImage(baseName, baseUrl);
        if (!thumbnailUrl) {
          const found = await searchWikiPage(baseName, baseUrl);
          if (found) {
            console.log(`    Wiki found: "${found}"`);
            thumbnailUrl = await getPageImage(found, baseUrl);
          }
        }
      }
    }

    // Try English name fallback: search the French name, but try the result in English
    if (!thumbnailUrl) {
      const shortName = variants.reduce((a, b) => a.length <= b.length ? a : b);
      const wikiTitle = await searchWikiPage(shortName, baseUrl);
      if (wikiTitle) {
        // Try French wiki page
        console.log(`    Wiki found (FR): "${wikiTitle}"`);
        thumbnailUrl = await getPageImage(wikiTitle, baseUrl);
      }
    }

    if (thumbnailUrl) {
      process.stdout.write(`    Downloading... `);
      const success = await downloadFile(thumbnailUrl, imagePath);
      if (success) {
        entry.image = imageUrl;
        writeFileSync(file, JSON.stringify(entry, null, 2) + '\n');
        console.log('OK');
        downloaded++;
      } else {
        console.log('FAIL');
        failed++;
      }
    } else {
      console.log(`    No image found`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Failed: ${failed}`);
}

main().catch(console.error);
