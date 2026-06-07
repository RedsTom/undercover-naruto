import { PlayerModel } from './Player';
import type { GameState, GameConfig, GamePhase } from '~/types';

export interface GameResult {
  winner: 'civilians' | 'undercover';
  exposed: Array<{ playerId: string; name: string; role: string; word: string | null }>;
  wordA: string;
  wordB: string;
  scores: { civilians: number; undercover: number };
}

export class RoomModel {
  id: string;
  code: string;
  hostId: string;
  players: Map<string, PlayerModel>;
  maxPlayers: number;
  createdAt: number;
  lastActivity: number;
  gameState: GameState | null;
  lastConfig: GameConfig | null = null;
  lastGameResult: GameResult | null = null;
  pendingConfig: GameConfig | null = null;
  anime: string;

  constructor(id: string, code: string, hostId: string, maxPlayers = 8, anime = '') {
    this.id = id;
    this.code = code;
    this.hostId = hostId;
    this.players = new Map();
    this.maxPlayers = maxPlayers;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.gameState = null;
    this.anime = anime;
  }

  addPlayer(player: PlayerModel): boolean {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    this.players.set(player.id, player);
    this.lastActivity = Date.now();
    return true;
  }

  removePlayer(playerId: string): boolean {
    const removed = this.players.delete(playerId);
    if (removed) {
      this.lastActivity = Date.now();
      if (playerId === this.hostId && this.players.size > 0) {
        const newHost = Array.from(this.players.values())[0];
        newHost.isHost = true;
        this.hostId = newHost.id;
      }
    }
    return removed;
  }

  getPlayer(playerId: string): PlayerModel | undefined {
    return this.players.get(playerId);
  }

  getAlivePlayers(): PlayerModel[] {
    return Array.from(this.players.values()).filter(p => p.isAlive);
  }

  isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  isInactive(timeoutMs = 600000): boolean {
    return Date.now() - this.lastActivity > timeoutMs;
  }

  initGameState(config: GameConfig): void {
    this.gameState = {
      phase: 'waiting',
      currentRound: 0,
      rounds: [],
      config,
      currentTurnIndex: 0,
      timerEndTime: null,
      winner: null,
      scores: {
        civilians: 0,
        undercover: 0,
      },
      usedWordKeys: [],
    };
  }

  setPhase(phase: GamePhase): void {
    if (this.gameState) {
      this.gameState.phase = phase;
    }
  }

  resetPlayers(): void {
    this.players.forEach(player => player.reset());
  }

  toPublic() {
    const gs = this.gameState;
    return {
      id: this.id,
      code: this.code,
      hostId: this.hostId,
      players: Array.from(this.players.values()).map(p => p.toPublic()),
      maxPlayers: this.maxPlayers,
      playerCount: this.players.size,
      gameState: gs ? {
        phase: gs.phase,
        currentRound: gs.currentRound,
        rounds: gs.rounds.map(r => ({
          roundNumber: r.roundNumber,
          eliminatedPlayerId: r.eliminatedPlayerId,
          voteCount: r.votes.length,
        })),
        config: gs.config,
        currentTurnIndex: gs.currentTurnIndex,
        timerEndTime: gs.timerEndTime,
        winner: gs.winner,
        scores: { ...gs.scores },
        exposed: gs.exposed,
      } : null,
      lastConfig: this.lastConfig,
      lastGameResult: this.lastGameResult,
      pendingConfig: this.pendingConfig,
      anime: this.anime,
    };
  }

  toPrivate(playerId: string) {
    const me = this.players.get(playerId);
    const hideRole = this.gameState?.config?.hideRole ?? false;
    return {
      myWord: me?.word ?? null,
      myRole: hideRole ? null : (me?.role ?? null),
      hideRole,
    };
  }
}