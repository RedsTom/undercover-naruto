import type { PlayerRole, GameState } from './game';

export interface PlayerPublic {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  discordId?: string;
  discordAvatar?: string;
}

export interface RoomSettings {
  maxPlayers: number;
  discussionTime: number;
  voteTime: number;
}

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  players: PlayerPublic[];
  maxPlayers: number;
  playerCount: number;
  gameState: GameState | null;
  myWord?: string | null;
  myRole?: string | null;
  anime?: string;
}