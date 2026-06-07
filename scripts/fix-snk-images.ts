import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const BASE_URL = 'https://attackontitan.fandom.com/api.php';

const ENGLISH_NAMES: Record<string, string> = {
  // Equipment
  'Lames': 'Blades (Anime)',
  'Lance-Tonnerre': 'Thunder Spear (Anime)',
  'Fusil': 'Rifle (Anime)',
  'Canon': 'Cannon (Anime)',
  'Bateau de Guerre': 'Warship (Anime)',
  'Avion': 'Flying boat (Anime)',
  'Équipement Tridimensionnel': 'Omni-directional mobility gear (Anime)',
  'Signal Fumigène': 'Smoke signal (Anime)',

  // Titans
  'Titan Assaillant': 'Attack Titan (Anime)',
  'Titan Cuirassé': 'Armored Titan (Anime)',
  'Titan Marteau': 'War Hammer Titan (Anime)',
  'Titan Originel': 'Founding Titan (Anime)',
  'Titan Mâchoire': 'Jaw Titan (Anime)',
  'Titan Bestial': 'Beast Titan (Anime)',
  'Titan Souriant': 'Smiling Titan (Anime)',
  'Titan Colossal': 'Colossal Titan (Anime)',
  'Titan de Rod Reiss': 'Rod Reiss Titan (Anime)',
  'Titan Féminin': 'Female Titan (Anime)',
  'Titan Charrette': 'Cart Titan (Anime)',

  // Organizations
  "Bataillon d'Entraînement": 'Cadet Corps (Anime)',
  "Bataillon d'Exploration": 'Scout Regiment (Anime)',
  'Brigade Centrale': 'Military Police Regiment (Anime)',
  'Escouade Anti-Personnel': 'Anti-Personnel Control Squad',
  'Restauration d\'Eldia': 'Eldian Restorationists',
  'Volontaires Anti-Marley': 'Anti-Marleyan Volunteers (Anime)',
  'Gouvernement Marley': 'Marley (Anime)',
  'Yeagerists': 'Yeagerists (Anime)',

  // Locations
  'Mur Maria': 'Wall Maria (Anime)',
  'Mur Rose': 'Wall Rose (Anime)',
  'Mur Sina': 'Wall Sina (Anime)',
  'Shiganshina': 'Shiganshina District (Anime)',
  'Trost': 'Trost District (Anime)',
  'Stohess': 'Stohess District (Anime)',
  'Liberio': 'Liberio (Anime)',
  'Paradis': 'Paradis Island',
  'Marley': 'Marley (Anime)',

  // Characters (usually correct as-is, but some might need help)
  'Ymir Fritz': 'Ymir Fritz (Anime)',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getPageImage(title: string): Promise<string | null> {
  const url = `${BASE_URL}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'UndercoverGame/1.0 (game)' } });
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
    const res = await fetch(url, { headers: { 'User-Agent': 'UndercoverGame/1.0 (game)' } });
    const data = await res.json() as any;
    const pages = data.query?.search;
    if (pages && pages.length > 0) return pages[0].title;
  } catch {}
  return null;
}

async function downloadFile(url: string, dest: string): Promise<boolean> {
  try {
    mkdirSync(dirname(dest), { recursive: true });
    const res = await fetch(url, { headers: { 'User-Agent': 'UndercoverGame/1.0 (game)' } });
    if (!res.ok) return false;
    const buffer = await res.arrayBuffer();
    writeFileSync(dest, Buffer.from(buffer));
    return true;
  } catch { return false; }
}

async function main() {
  const entries: { file: string; name: string; entry: any }[] = [];
  const { readdirSync } = await import('node:fs');

  function findJson(dir: string) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) findJson(full);
      else if (e.name.endsWith('.json') && e.name !== 'manifest.json') {
        const entry = JSON.parse(readFileSync(full, 'utf-8'));
        if (ENGLISH_NAMES[entry.name]) {
          entries.push({ file: full, name: entry.name, entry });
        }
      }
    }
  }
  findJson('data/attaque-des-titans');

  let fixed = 0; 0;
  let failed = 0;

  for (const { file, name, entry } of entries) {
    const englishName = ENGLISH_NAMES[name];
    const imagePath = join('data/images/attaque-des-titans', entry.category, `${slugify(entry.name)}.png`);
    const imageUrl = `/images/attaque-des-titans/${entry.category}/${slugify(entry.name)}.png`;

    console.log(`\n  ${name} → trying "${englishName}"`);

    let thumbnailUrl = await getPageImage(englishName);
    if (!thumbnailUrl) {
      const found = await searchWikiPage(englishName);
      if (found) {
        console.log(`    Wiki found: "${found}"`);
        thumbnailUrl = await getPageImage(found);
      }
    }

    if (thumbnailUrl) {
      process.stdout.write(`    Downloading... `);
      const ok = await downloadFile(thumbnailUrl, imagePath);
      if (ok) {
        entry.image = imageUrl;
        writeFileSync(file, JSON.stringify(entry, null, 2) + '\n');
        console.log('OK');
        fixed++;
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

  // Also try remaining failed entries (those not in ENGLISH_NAMES)
  const allEntries: { file: string; entry: any }[] = [];
  function findAllJson(dir: string) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) findAllJson(full);
      else if (e.name.endsWith('.json') && e.name !== 'manifest.json') {
        const entry = JSON.parse(readFileSync(full, 'utf-8'));
        const imagePath = join('data/images/attaque-des-titans', entry.category, `${slugify(entry.name)}.png`);
        if (entry.name && !ENGLISH_NAMES[entry.name] && !existsSync(imagePath)) {
          allEntries.push({ file: full, entry });
        }
      }
    }
  }
  findAllJson('data/attaque-des-titans');

  for (const { file, entry } of allEntries) {
    const imagePath = join('data/images/attaque-des-titans', entry.category, `${slugify(entry.name)}.png`);
    const imageUrl = `/images/attaque-des-titans/${entry.category}/${slugify(entry.name)}.png`;

    console.log(`\n  ${entry.name} (${entry.category}) — fallback search`);
    const found = await searchWikiPage(entry.name);
    if (found) {
      console.log(`    Wiki found: "${found}"`);
      const thumbnailUrl = await getPageImage(found);
      if (thumbnailUrl) {
        process.stdout.write(`    Downloading... `);
        const ok = await downloadFile(thumbnailUrl, imagePath);
        if (ok) {
          entry.image = imageUrl;
          writeFileSync(file, JSON.stringify(entry, null, 2) + '\n');
          console.log('OK');
          fixed++;
        } else {
          console.log('FAIL');
          failed++;
        }
      } else {
        console.log('    No thumbnail on page');
        failed++;
      }
    } else {
      console.log('    No wiki match');
      failed++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! Fixed: ${fixed}, Failed: ${failed}`);
}

main().catch(console.error);
