import type { Vote, VoteResult } from '~/types';
import { RoomModel } from '../models/Room';

export class VoteService {
  static castVote(room: RoomModel, voterId: string, targetId: string): boolean {
    if (!room.gameState || room.gameState.phase !== 'voting') return false;

    const voter = room.getPlayer(voterId);
    if (!voter || !voter.isAlive) return false;

    if (targetId !== 'neutral') {
      const target = room.getPlayer(targetId);
      if (!target || !target.isAlive) return false;
      if (voterId === targetId) return false;
    }

    const currentRound = room.gameState.rounds[room.gameState.rounds.length - 1];
    const existingVoteIndex = currentRound.votes.findIndex(v => v.voterId === voterId);

    if (existingVoteIndex >= 0) {
      currentRound.votes[existingVoteIndex] = { voterId, targetId };
    } else {
      currentRound.votes.push({ voterId, targetId });
    }

    room.updateActivity();
    return true;
  }

  static resolveVotes(room: RoomModel): VoteResult {
    if (!room.gameState) {
      return { eliminatedPlayerId: null, votes: {}, isTie: false };
    }

    const currentRound = room.gameState.rounds[room.gameState.rounds.length - 1];
    const voteCounts: Record<string, number> = {};

    currentRound.votes.forEach(vote => {
      if (vote.targetId === 'neutral') return;
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let eliminatedPlayerId: string | null = null;
    let isTie = false;

    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayerId = playerId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    if (isTie) {
      eliminatedPlayerId = null;
    }

    currentRound.eliminatedPlayerId = eliminatedPlayerId;

    if (eliminatedPlayerId) {
      const player = room.getPlayer(eliminatedPlayerId);
      if (player) {
        player.eliminate();
      }
    }

    return { eliminatedPlayerId, votes: voteCounts, isTie };
  }

  static hasAllVoted(room: RoomModel): boolean {
    if (!room.gameState) return false;

    const currentRound = room.gameState.rounds[room.gameState.rounds.length - 1];
    const alivePlayers = room.getAlivePlayers();

    return currentRound.votes.length >= alivePlayers.length;
  }

  static resetVotes(room: RoomModel): void {
    if (!room.gameState) return;

    const currentRound = room.gameState.rounds[room.gameState.rounds.length - 1];
    if (currentRound) {
      currentRound.votes = [];
    }
  }
}
