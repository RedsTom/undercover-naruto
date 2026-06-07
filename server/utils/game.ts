import { RoomModel } from '../models';
import { GameService, VoteService } from '../services';

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

export function castVote(room: RoomModel, voterId: string, targetId: string): { success: boolean; error?: string; roundEnded?: boolean; wasTie?: boolean; result?: any } {
  const voteSuccess = VoteService.castVote(room, voterId, targetId);
  if (!voteSuccess) return { success: false, error: 'Invalid vote' };

  if (!VoteService.hasAllVoted(room)) return { success: true };

  const result = VoteService.resolveVotes(room);

  if (result.isTie) {
    VoteService.resetVotes(room);
    room.setPhase('discussion');
    room.gameState!.currentTurnIndex = 0;
    room.gameState!.timerEndTime = Date.now() + room.gameState!.config.discussionTime * 1000;
    return { success: true, roundEnded: true, wasTie: true, result };
  }

  room.gameState!.exposed = Array.from(room.players.values()).map(p => ({
    playerId: p.id,
    name: p.name,
    role: p.role ?? 'unknown',
    word: p.word ?? null,
  }));

  const lastRound = room.gameState!.rounds[room.gameState!.rounds.length - 1];
  if (lastRound?.eliminatedRole === 'undercover' || lastRound?.eliminatedRole === 'mrWhite') {
    room.gameState!.scores.civilians++;
  } else if (room.getAlivePlayers().length <= 2) {
    room.gameState!.scores.undercover++;
  }

  room.setPhase('reveal');

  return { success: true, roundEnded: true, result };
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

export function continueRound(room: RoomModel, playerId: string): { success: boolean; error?: string } {
  if (room.hostId !== playerId) return { success: false, error: 'Only host can advance' };

  const success = GameService.continueRound(room);
  if (!success) return { success: false, error: 'Cannot continue' };

  return { success: true };
}

export function resetGame(room: RoomModel, playerId: string): { success: boolean; error?: string } {
  if (room.hostId !== playerId) return { success: false, error: 'Only host can reset' };

  GameService.resetGame(room);
  return { success: true };
}
