import type { PlayerRole } from '~/types';

export class PlayerModel {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  role?: PlayerRole;
  word?: string | null;
  isAlive: boolean;
  discordId?: string;
  discordAvatar?: string;

  constructor(id: string, name: string, isHost = false) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;
    this.isReady = false;
    this.isAlive = true;
    this.word = null;
  }

  assignRole(role: PlayerRole): void {
    this.role = role;
  }

  assignWord(word: string | null): void {
    this.word = word;
  }

  eliminate(): void {
    this.isAlive = false;
  }

  reset(): void {
    this.role = undefined;
    this.word = null;
    this.isAlive = true;
    this.isReady = false;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      isReady: this.isReady,
      isAlive: this.isAlive,
      discordId: this.discordId,
      discordAvatar: this.discordAvatar,
    };
  }

  toPrivate() {
    return {
      ...this.toPublic(),
      role: this.role,
      word: this.word,
    };
  }
}