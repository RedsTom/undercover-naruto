import { RoomModel } from '../models';
import { GameService, VoteService, WordService } from '../services';

export function startGame(room: RoomModel, playerId: string, config?: Record<string, any>): { success: boolean; error?: string } {
  if (room.hostId !== playerId) return { success: false, error: 'Only host can start' };

  if (room.gameState?.phase === 'waiting' && room.gameState.currentRound > 0) {
    const success = GameService.continueGame(room, config as any);
    if (!success) return { success: false, error: 'Cannot continue game' };
    return { success: true };
  }

  if (room.players.size < 3) return { success: false, error: 'Not enough players (min 3)' };

  const success = GameService.startGame(room, config as any);
  if (!success) return { success: false, error: 'Cannot start game' };
  return { success: true };
}

export function finalizeElimination(room: RoomModel, currentRound: any): void {
  const gameState = room.gameState!;
  const eliminatedPlayer = room.getPlayer(currentRound.eliminatedPlayerId!);

  if (eliminatedPlayer) {
    if (eliminatedPlayer.role === 'undercover' || eliminatedPlayer.role === 'mrWhite') {
      gameState.scores.civilians++;
    } else if (room.getAlivePlayers().length <= 2) {
      gameState.scores.undercover++;
    }
  }

  const winner = GameService.checkWinCondition(room);
  if (winner) {
    gameState.winner = winner;
    gameState.exposed = Array.from(room.players.values()).map(p => ({
      playerId: p.id,
      name: p.name,
      role: p.role ?? 'unknown',
      word: p.word ?? null,
    }));
    gameState.phase = 'finished';
  } else {
    WordService.assignWords(room, true);
    gameState.currentTurnIndex = 0;
    gameState.timerEndTime = Date.now() + gameState.config.discussionTime * 1000;
    gameState.phase = 'discussion';
  }
}

export function resolveVoting(room: RoomModel): { success: boolean; error?: string; wasTie?: boolean; roundEnded?: boolean } {
  const gameState = room.gameState;
  if (!gameState || gameState.phase !== 'voting') return { success: false, error: 'Not in voting phase' };

  const currentRound = gameState.rounds[gameState.rounds.length - 1];
  if (!currentRound || currentRound.eliminatedPlayerId) return { success: false, error: 'Vote already resolved' };

  const alivePlayers = room.getAlivePlayers();

  for (const p of alivePlayers) {
    const hasVoted = currentRound.votes.some(v => v.voterId === p.id);
    if (!hasVoted) {
      currentRound.votes.push({ voterId: p.id, targetId: 'neutral' });
    }
  }

  const result = VoteService.resolveVotes(room);

  if (result.isTie) {
    VoteService.resetVotes(room);
    gameState.currentTurnIndex = 0;
    gameState.timerEndTime = Date.now() + gameState.config.discussionTime * 1000;
    gameState.phase = 'discussion';
    return { success: true, wasTie: true, roundEnded: true };
  }

  finalizeElimination(room, currentRound);
  return { success: true, wasTie: false, roundEnded: true };
}

export function castVote(room: RoomModel, voterId: string, targetId: string): { success: boolean; error?: string; roundEnded?: boolean; wasTie?: boolean; result?: any } {
  const voteSuccess = VoteService.castVote(room, voterId, targetId);
  if (!voteSuccess) return { success: false, error: 'Invalid vote' };

  if (!VoteService.hasAllVoted(room)) return { success: true };

  return resolveVoting(room);
}

export function nextTurn(room: RoomModel, playerId: string): { success: boolean; error?: string } {
  if (room.hostId !== playerId && !GameService.isCurrentSpeaker(room, playerId)) {
    return { success: false, error: 'Only host or current speaker can advance turn' };
  }

  GameService.nextTurn(room);
  return { success: true };
}

export function startVoting(room: RoomModel, playerId: string): { success: boolean; error?: string } {
  if (room.hostId !== playerId && !GameService.isCurrentSpeaker(room, playerId)) {
    return { success: false, error: 'Only host or current speaker can start voting' };
  }

  GameService.startVoting(room);
  return { success: true };
}

export function nextRound(room: RoomModel, playerId: string): { success: boolean; error?: string } {
  if (room.hostId !== playerId) return { success: false, error: 'Only host can advance' };

  GameService.returnToLobby(room);
  return { success: true };
}

export function resetGame(room: RoomModel, playerId: string): { success: boolean; error?: string } {
  if (room.hostId !== playerId) return { success: false, error: 'Only host can reset' };

  GameService.resetGame(room);
  return { success: true };
}