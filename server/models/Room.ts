import { PlayerModel } from './Player';
import type { GameState, GameConfig, GamePhase } from '~/types';

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

  constructor(id: string, code: string, hostId: string, maxPlayers = 8) {
    this.id = id;
    this.code = code;
    this.hostId = hostId;
    this.players = new Map();
    this.maxPlayers = maxPlayers;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.gameState = null;
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

  toPublic(): {
    id: string;
    code: string;
    hostId: string;
    players: ReturnType<PlayerModel['toPublic']>[];
    maxPlayers: number;
    playerCount: number;
    gameState: GameState | null;
    lastConfig: GameConfig | null;
  } {
    return {
      id: this.id,
      code: this.code,
      hostId: this.hostId,
      players: Array.from(this.players.values()).map(p => p.toPublic()),
      maxPlayers: this.maxPlayers,
      playerCount: this.players.size,
      gameState: this.gameState,
      lastConfig: this.lastConfig,
    };
  }

  toPrivate(playerId: string): {
    id: string;
    code: string;
    hostId: string;
    players: ReturnType<PlayerModel['toPublic']>[];
    maxPlayers: number;
    playerCount: number;
    gameState: GameState | null;
    lastConfig: GameConfig | null;
    myWord: string | null;
    myRole: string | null;
  } {
    const me = this.players.get(playerId);
    return {
      ...this.toPublic(),
      myWord: me?.word ?? null,
      myRole: me?.role ?? null,
    };
  }
}