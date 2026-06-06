import type { WordPair, GameMode, Difficulty } from '~/types';
import { RoomModel } from '../models/Room';
import { getRandomWordPair as getRandomPair } from './DataService';

export class WordService {
  static getRandomWordPair(anime: string, eras: string[] = [], difficulty: Difficulty = 'mixed', categories: string[] = [], excludeKeys: Set<string> = new Set()): WordPair {
    const diff = difficulty === 'mixed' ? undefined : difficulty;
    let candidate = getRandomPair(anime, eras, 3, diff, excludeKeys, categories);
    if (!candidate) candidate = getRandomPair(anime, eras, 2, diff, excludeKeys, categories);
    if (!candidate) candidate = getRandomPair(anime, eras, 1, diff, excludeKeys, categories);

    if (!candidate) {
      throw new Error('Aucune paire de mots trouvée pour les époques sélectionnées. Essayez d\'ajouter plus d\'époques.');
    }

    return {
      wordA: candidate.wordA,
      wordB: candidate.wordB,
      difficulty: candidate.difficulty,
      category: candidate.category,
    };
  }

  static assignWords(room: RoomModel, aliveOnly = false): void {
    if (!room.gameState) return;

    const anime = room.gameState.config.anime || 'naruto';
    const eras = room.gameState.config.eras ?? [];
    const difficulty = room.gameState.config.difficulty || 'mixed';
    const categories = room.gameState.config.categories ?? [];
    const excludeKeys = new Set(room.gameState.usedWordKeys);
    const wordPair = WordService.getRandomWordPair(anime, eras, difficulty, categories, excludeKeys);
    const allPlayers = Array.from(room.players.values());
    const players = aliveOnly ? allPlayers.filter(p => p.isAlive) : allPlayers;
    const mode = room.gameState.config.mode;
    const hasMrWhite = room.gameState.config.mrWhite;
    const undercoverCount = WordService.getInfiltratorCount(players.length, mode, hasMrWhite);

    const pairKey = [wordPair.wordA, wordPair.wordB].sort().join(':');
    room.gameState.usedWordKeys.push(pairKey);

    const shuffled = WordService.shuffle(players);
    let idx = 0;

    if (hasMrWhite) {
      shuffled[idx].assignRole('mrWhite');
      shuffled[idx].assignWord(null);
      idx++;
    }

    for (let i = 0; i < undercoverCount; i++) {
      shuffled[idx].assignRole('undercover');
      shuffled[idx].assignWord(wordPair.wordB);
      idx++;
    }

    while (idx < shuffled.length) {
      shuffled[idx].assignRole('civil');
      shuffled[idx].assignWord(wordPair.wordA);
      idx++;
    }

    room.gameState.rounds.push({
      roundNumber: room.gameState.currentRound + 1,
      wordPair,
      votes: [],
      eliminatedPlayerId: null,
    });
    room.gameState.currentRound++;
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static getInfiltratorCount(playerCount: number, mode: GameMode, hasMrWhite?: boolean): number {
    let count = 1;
    if (mode === 'doubleInfiltration' && playerCount >= 6) count = 2;
    if (hasMrWhite) count = Math.max(1, count);
    return Math.min(count, playerCount - (hasMrWhite ? 2 : 1));
  }
}
