import { getRoom } from './rooms';
import { broadcastToRoom } from './sse';
import { VoteService } from '../services/VoteService';
import type { RoomModel, PlayerModel } from '../models';
import type { Vote } from '~/types';

function resolveVotingPhase(room: RoomModel, playerId: string): void {
  const gameState = room.gameState;
  if (!gameState) return;
  const currentRound = gameState.rounds[gameState.rounds.length - 1];
  if (!currentRound || currentRound.eliminatedPlayerId) return;

  currentRound.votes.push({ voterId: playerId, targetId: 'neutral' });

  const alivePlayers = room.getAlivePlayers();
  if (currentRound.votes.length < alivePlayers.length) return;

  const result = VoteService.resolveVotes(room);

  if (result.isTie) {
    VoteService.resetVotes(room);
    room.setPhase('discussion');
    gameState.currentTurnIndex = 0;
    gameState.timerEndTime = Date.now() + gameState.config.discussionTime * 1000;
  } else {
    gameState.exposed = Array.from(room.players.values()).map(p => ({
      playerId: p.id,
      name: p.name,
      role: p.role ?? 'unknown',
      word: p.word ?? null,
    }));

    const lastRound = gameState.rounds[gameState.rounds.length - 1];
    if (lastRound?.eliminatedRole === 'undercover' || lastRound?.eliminatedRole === 'mrWhite') {
      gameState.scores.civilians++;
    } else if (alivePlayers.length <= 2) {
      gameState.scores.undercover++;
    }

    room.setPhase('reveal');
  }
}

function eliminateInGamePlayer(room: RoomModel, player: PlayerModel, playerId: string): void {
  const gameState = room.gameState;
  if (!gameState) return;
  const currentRound = gameState.rounds[gameState.rounds.length - 1];
  if (!currentRound || currentRound.eliminatedPlayerId) return;

  currentRound.eliminatedPlayerId = playerId;
  currentRound.eliminatedRole = player.role;
  currentRound.eliminatedWord = player.word;
  gameState.phase = 'reveal';
  const excludedVote: Vote = { voterId: playerId, targetId: playerId };
  currentRound.votes.push(excludedVote);
  player.eliminate();
}

export function handlePlayerDisconnect(roomId: string, playerId: string): void {
  const room = getRoom(roomId);
  if (!room) return;

  const player = room.getPlayer(playerId);
  if (!player) return;

  const wasHost = player.isHost;

  if (room.gameState && room.gameState.phase !== 'waiting' && room.gameState.phase !== 'finished') {
    if (room.gameState.phase === 'voting') {
      room.removePlayer(playerId);
      if (room.players.size === 0) {
        broadcastToRoom(roomId, 'room:closed', {});
        return;
      }
      resolveVotingPhase(room, playerId);
    } else {
      eliminateInGamePlayer(room, player, playerId);
      room.removePlayer(playerId);
    }
  } else {
    room.removePlayer(playerId);
  }

  if (room.players.size === 0) {
    broadcastToRoom(roomId, 'room:closed', {});
    return;
  }

  broadcastToRoom(roomId, 'room:updated', room.toPublic());

  if (wasHost && room.hostId !== playerId) {
    broadcastToRoom(roomId, 'host:changed', { newHostId: room.hostId });
  }
}
