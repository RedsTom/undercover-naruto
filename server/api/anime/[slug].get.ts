import { loadManifest } from '../../services/DataService';

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing anime slug' });
  }

  const manifest = loadManifest(slug);
  if (!manifest) {
    throw createError({ statusCode: 404, message: 'Anime not found' });
  }

  return manifest;
});