export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export type GameMode = 'classic' | 'doubleInfiltration';

export type GamePhase = 'waiting' | 'playing' | 'discussion' | 'voting' | 'reveal' | 'finished';

export type PlayerRole = 'civil' | 'undercover' | 'mrWhite';

export type WordCategory = string;

export interface WordPair {
  wordA: string;
  wordB: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: WordCategory;
}

export interface PlayerGameState {
  playerId: string;
  word: string | null;
  role: PlayerRole;
  isAlive: boolean;
  hasVoted: boolean;
  votesReceived: number;
}

export interface GameConfig {
  mode: GameMode;
  discussionTime: number;
  voteTime: number;
  maxPlayers: number;
  minPlayers: number;
  eras: string[];
  anime: string;
  difficulty: Difficulty;
  categories: string[];
  hideRole: boolean;
  mrWhite: boolean;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface VoteResult {
  eliminatedPlayerId: string | null;
  votes: Record<string, number>;
  isTie: boolean;
}

export interface GameRound {
  roundNumber: number;
  wordPair: WordPair;
  votes: Vote[];
  eliminatedPlayerId: string | null;
  eliminatedRole?: string;
  eliminatedWord?: string | null;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  rounds: GameRound[];
  config: GameConfig;
  currentTurnIndex: number;
  timerEndTime: number | null;
  winner: 'civilians' | 'undercover' | null;
  scores: {
    civilians: number;
    undercover: number;
  };
  usedWordKeys: string[];
  exposed?: Array<{
    playerId: string;
    name: string;
    role: string;
    word: string | null;
  }>;
}