import { getRoom } from './rooms';
import { broadcastToRoom } from './sse';
import type { RoomModel, PlayerModel } from '../models';
import type { Vote } from '~/types';

function eliminateInGamePlayer(room: RoomModel, player: PlayerModel, playerId: string): void {
  const gameState = room.gameState;
  if (!gameState) return;
  const currentRound = gameState.rounds[gameState.rounds.length - 1];
  if (!currentRound || currentRound.eliminatedPlayerId) return;

  currentRound.eliminatedPlayerId = playerId;
  const excludedVote: Vote = { voterId: playerId, targetId: playerId };
  currentRound.votes.push(excludedVote);
  player.eliminate();

  finalizeElimination(room, currentRound);
}

function broadcastAfterCleanup(roomId: string, room: RoomModel, wasHost: boolean, playerId: string): void {
  if (room.players.size === 0) {
    broadcastToRoom(roomId, 'room:closed', {});
    return;
  }

  broadcastToRoom(roomId, 'room:updated', room.toPublic());

  if (wasHost && room.hostId !== playerId) {
    broadcastToRoom(roomId, 'host:changed', { newHostId: room.hostId });
  }
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
      const result = resolveVoting(room);
      if (!result.success) {
        broadcastAfterCleanup(roomId, room, wasHost, playerId);
        return;
      }
      broadcastToRoom(roomId, 'room:updated', room.toPublic());
      broadcastToRoom(roomId, result.wasTie ? 'game:continued' : 'game:roundEnded', room.toPublic());
      if (wasHost && room.hostId !== playerId) {
        broadcastToRoom(roomId, 'host:changed', { newHostId: room.hostId });
      }
      return;
    }

    eliminateInGamePlayer(room, player, playerId);
    room.removePlayer(playerId);
  } else {
    room.removePlayer(playerId);
  }

  broadcastAfterCleanup(roomId, room, wasHost, playerId);
}