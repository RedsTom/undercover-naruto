import { listAvailableAnime } from '../services/DataService';

export default defineEventHandler(() => {
  return listAvailableAnime();
});