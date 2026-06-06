import { generateWordPairs } from '../services/DataService';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { anime, eras, minOverlap, categories } = body;

  const slug = anime || 'naruto';
  const erasArr = eras || [];
  const min = minOverlap || 3;
  const cats = categories || [];

  const pairs = generateWordPairs(slug, erasArr, min, new Set(), cats);

  return { pairs };
});