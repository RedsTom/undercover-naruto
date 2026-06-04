import type { GameMode, GameConfig } from '~/types';
import { RoomModel } from '../models/Room';
import { WordService } from './WordService';
import { VoteService } from './VoteService';

export class GameService {
  static readonly DEFAULT_CONFIG: GameConfig = {
    mode: 'classic',
    discussionTime: 60,
    voteTime: 30,
    maxPlayers: 8,
    minPlayers: 3,
    eras: [],
    hideRole: false,
    mrWhite: false,
  };

  static canStartGame(room: RoomModel): boolean {
    if (!room.gameState) return false;
    const playerCount = room.players.size;
    return playerCount >= room.gameState.config.minPlayers;
  }

  static startGame(room: RoomModel, config?: Partial<GameConfig>): boolean {
    const mergedConfig: GameConfig = {
      ...GameService.DEFAULT_CONFIG,
      ...config,
    };

    room.initGameState(mergedConfig);
    room.resetPlayers();

    if (!GameService.canStartGame(room)) {
      return false;
    }

    WordService.assignWords(room);
    GameService.shufflePlayers(room);
    room.setPhase('discussion');
    room.gameState.currentTurnIndex = 0;
    room.gameState.timerEndTime = Date.now() + mergedConfig.discussionTime * 1000;

    return true;
  }

  static shufflePlayers(room: RoomModel): void {
    const entries = Array.from(room.players.entries());
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    room.players = new Map(entries);
  }

  static nextTurn(room: RoomModel): void {
    if (!room.gameState || room.gameState.phase !== 'discussion') return;

    const alivePlayers = room.getAlivePlayers();
    room.gameState.currentTurnIndex = (room.gameState.currentTurnIndex + 1) % alivePlayers.length;
    room.gameState.timerEndTime = Date.now() + room.gameState.config.discussionTime * 1000;
    room.updateActivity();
  }

  static isCurrentSpeaker(room: RoomModel, playerId: string): boolean {
    if (!room.gameState || room.gameState.phase !== 'discussion') return false;
    const alivePlayers = room.getAlivePlayers();
    return alivePlayers[room.gameState.currentTurnIndex]?.id === playerId;
  }

  static startVoting(room: RoomModel): void {
    if (!room.gameState) return;

    room.setPhase('voting');
    VoteService.resetVotes(room);
    room.gameState.timerEndTime = Date.now() + room.gameState.config.voteTime * 1000;
    room.updateActivity();
  }

  static checkWinCondition(room: RoomModel): 'civilians' | 'undercover' | null {
    if (!room.gameState) return null;

    const alivePlayers = room.getAlivePlayers();
    const civilians = alivePlayers.filter(p => p.role === 'civil');
    const undercover = alivePlayers.filter(p => p.role === 'undercover' || p.role === 'mrWhite');

    if (undercover.length === 0) return 'civilians';
    if (undercover.length >= civilians.length) return 'undercover';

    return null;
  }

  static endRound(room: RoomModel): void {
    if (!room.gameState) return;

    const result = VoteService.resolveVotes(room);
    const winner = GameService.checkWinCondition(room);

    if (winner) {
      room.setPhase('finished');
      if (winner === 'civilians') {
        room.gameState.scores.civilians++;
      } else {
        room.gameState.scores.undercover++;
      }
    } else {
      room.setPhase('reveal');
    }

    room.updateActivity();
  }

  static startNewRound(room: RoomModel): void {
    if (!room.gameState) return;

    room.players.forEach(p => {
      if (p.isAlive) {
        p.word = undefined;
        p.role = undefined;
      }
    });

    WordService.assignWords(room);
    GameService.shufflePlayers(room);
    room.setPhase('discussion');
    room.gameState.currentTurnIndex = 0;
    room.gameState.timerEndTime = Date.now() + room.gameState.config.discussionTime * 1000;
    room.updateActivity();
  }

  static resetGame(room: RoomModel): void {
    room.gameState = null;
    room.resetPlayers();
    room.setPhase('waiting');
    room.updateActivity();
  }
}
