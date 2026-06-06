import { generateWordPairs } from '../services/DataService';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { anime, eras, minOverlap } = body;

  const slug = anime || 'naruto';
  const erasArr = eras || [];
  const min = minOverlap || 3;

  const pairs = generateWordPairs(slug, erasArr, min);

  return { pairs };
});