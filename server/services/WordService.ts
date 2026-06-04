import type { WordPair, GameMode } from '~/types';
import { RoomModel } from '../models/Room';
import { getRandomWordPair as getRandomPair } from './DataService';

export class WordService {
  static getRandomWordPair(eras: string[] = []): WordPair {
    const candidate = getRandomPair(eras);
    return {
      wordA: candidate.wordA,
      wordB: candidate.wordB,
      difficulty: candidate.difficulty,
      category: candidate.category,
    };
  }

  static assignWords(room: RoomModel): void {
    if (!room.gameState) return;

    const eras = room.gameState.config.eras ?? [];
    const wordPair = WordService.getRandomWordPair(eras);
    const players = Array.from(room.players.values());
    const mode = room.gameState.config.mode;
    const infiltrators = WordService.getInfiltratorCount(players.length, mode);

    const shuffled = [...players].sort(() => Math.random() - 0.5);

    shuffled.forEach((player, index) => {
      if (mode === 'mrWhite' && index === 0) {
        player.assignRole('mrWhite');
        player.assignWord(null);
      } else if (index < infiltrators) {
        player.assignRole('undercover');
        player.assignWord(wordPair.wordB);
      } else {
        player.assignRole('civil');
        player.assignWord(wordPair.wordA);
      }
    });

    room.gameState.rounds.push({
      roundNumber: room.gameState.currentRound + 1,
      wordPair,
      votes: [],
      eliminatedPlayerId: null,
    });
    room.gameState.currentRound++;
  }

  static getInfiltratorCount(playerCount: number, mode: GameMode): number {
    if (mode === 'mrWhite') return 1;
    if (mode === 'doubleInfiltration' && playerCount >= 6) return 2;
    return 1;
  }
}
