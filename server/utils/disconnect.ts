import { getRoom } from './rooms';
import { broadcastToRoom } from './sse';
import type { Vote } from '~/types';

export function handlePlayerDisconnect(roomId: string, playerId: string): void {
  const room = getRoom(roomId);
  if (!room) return;

  const player = room.getPlayer(playerId);
  if (!player) return;

  const wasHost = player.isHost;

  room.removePlayer(playerId);

  if (room.players.size === 0) {
    broadcastToRoom(roomId, 'room:closed', {});
    return;
  }

  if (room.gameState && room.gameState.phase !== 'waiting' && room.gameState.phase !== 'finished') {
    const gameState = room.gameState;
    const currentRound = gameState.rounds[gameState.rounds.length - 1];
    if (currentRound && !currentRound.eliminatedPlayerId) {
      currentRound.eliminatedPlayerId = playerId;
      currentRound.eliminatedRole = player.role;
      currentRound.eliminatedWord = player.word;
      gameState.phase = 'reveal';
      const excludedVote: Vote = { voterId: playerId, targetId: playerId };
      currentRound.votes.push(excludedVote);
      player.eliminate();
    }
  }

  broadcastToRoom(roomId, 'room:updated', room.toPublic());

  if (wasHost && room.hostId !== playerId) {
    broadcastToRoom(roomId, 'host:changed', { newHostId: room.hostId });
  }
}
