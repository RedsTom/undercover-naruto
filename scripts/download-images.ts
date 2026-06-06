import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const BASE_URL = 'https://naruto.fandom.com/api.php';

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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function findAllJsonFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findAllJsonFiles(full));
    } else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
      results.push(full);
    }
  }
  return results;
}

function getEntries(): { file: string; entry: AnimeEntry }[] {
  const files = findAllJsonFiles('data/naruto');
  return files.map(file => ({
    file,
    entry: JSON.parse(readFileSync(file, 'utf-8')) as AnimeEntry,
  }));
}

async function getPageImage(title: string): Promise<string | null> {
  const url = `${BASE_URL}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'UndercoverNaruto/1.0 (game)' },
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

async function searchWikiPage(query: string): Promise<string | null> {
  const url = `${BASE_URL}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'UndercoverNaruto/1.0 (game)' },
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
      headers: { 'User-Agent': 'UndercoverNaruto/1.0 (game)' },
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

  // Remove parenthetical translations
  const withoutParens = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (withoutParens !== name) variants.push(withoutParens);

  // Remove "—" separator (kage format)
  // "Naruto Uzumaki — 7e Hokage" → "Naruto Uzumaki"
  const withoutDash = name.replace(/\s*—\s*.*$/, '').trim();
  if (withoutDash !== name && withoutDash !== withoutParens) variants.push(withoutDash);

  // Take just the French name before "—"
  const justFrench = name.replace(/—.*$/, '').trim();
  if (justFrench !== name && !variants.includes(justFrench)) variants.push(justFrench);

  return variants;
}

function getImageUrl(entry: AnimeEntry): string {
  return `/images/naruto/${entry.category}/${slugify(entry.name)}.png`;
}

function getImagePath(entry: AnimeEntry): string {
  return join('data/images/naruto', entry.category, `${slugify(entry.name)}.png`);
}

async function main() {
  const entries = getEntries();
  console.log(`Total entries: ${entries.length}`);

  // Find entries without images
  const todo = entries.filter(({ entry }) => {
    const path = getImagePath(entry);
    return !existsSync(path) || !entry.image;
  });
  console.log(`Entries needing images: ${todo.length}`);

  let downloaded = 0;
  let failed = 0;

  for (const { file, entry } of todo) {
    const imagePath = getImagePath(entry);
    const imageUrl = getImageUrl(entry);

    // Already have the file
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

    // Try each variant as a direct page title
    for (const v of variants) {
      thumbnailUrl = await getPageImage(v);
      if (thumbnailUrl) {
        foundTitle = v;
        break;
      }
    }

    // If not found, search wiki with shortest variant
    if (!thumbnailUrl) {
      const searchTerm = variants.reduce((a, b) => a.length <= b.length ? a : b);
      foundTitle = await searchWikiPage(searchTerm);
      if (foundTitle && foundTitle !== searchTerm) {
        console.log(`    Wiki found: "${foundTitle}"`);
        thumbnailUrl = await getPageImage(foundTitle);
      }
    }

    // Handle kage entries: try the base character name without title
    if (!thumbnailUrl && entry.category === 'kage') {
      const baseName = entry.name.replace(/\s*—\s*.*$/, '').trim();
      if (baseName !== entry.name) {
        console.log(`    Trying base name: "${baseName}"`);
        thumbnailUrl = await getPageImage(baseName);
        if (!thumbnailUrl) {
          const found = await searchWikiPage(baseName);
          if (found) {
            console.log(`    Wiki found: "${found}"`);
            thumbnailUrl = await getPageImage(found);
          }
        }
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
