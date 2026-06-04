import { RoomModel, PlayerModel } from '../models';
import { GameService, VoteService } from '../services';

const rooms = new Map<string, RoomModel>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function getRoom(id: string): RoomModel | undefined {
  return rooms.get(id);
}

export function getRoomByCode(code: string): RoomModel | undefined {
  return Array.from(rooms.values()).find(r => r.code === code.toUpperCase());
}

export function createRoom(hostName: string): { room: RoomModel; player: PlayerModel } {
  const roomId = Math.random().toString(36).substring(2, 10);
  const roomCode = generateRoomCode();
  const playerId = Math.random().toString(36).substring(2, 10);

  const room = new RoomModel(roomId, roomCode, playerId);
  const player = new PlayerModel(playerId, hostName, true);
  room.addPlayer(player);
  rooms.set(roomId, room);

  return { room, player };
}

export function joinRoom(roomCode: string, playerName: string): { room: RoomModel; player: PlayerModel } | { error: string } {
  const room = getRoomByCode(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.isFull()) return { error: 'Room is full' };

  const playerId = Math.random().toString(36).substring(2, 10);
  const player = new PlayerModel(playerId, playerName, false);
  if (!room.addPlayer(player)) return { error: 'Could not join room' };

  return { room, player };
}

export function kickPlayer(roomId: string, hostId: string, targetId: string): { success: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== hostId) return { success: false, error: 'Only host can kick players' };
  if (hostId === targetId) return { success: false, error: 'Cannot kick yourself' };
  if (room.gameState?.phase && room.gameState.phase !== 'waiting') return { success: false, error: 'Cannot kick during a game' };

  const removed = room.removePlayer(targetId);
  if (!removed) return { success: false, error: 'Player not found' };

  broadcastToRoom(roomId, 'player:kicked', { playerId: targetId });
  broadcastToRoom(roomId, 'room:updated', room.toPublic());

  if (room.players.size === 0) rooms.delete(roomId);

  return { success: true };
}

export function startGame(roomId: string, playerId: string, config?: Record<string, any>): { success: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== playerId) return { success: false, error: 'Only host can start' };
  if (room.players.size < 3) return { success: false, error: 'Not enough players (min 3)' };

  const success = GameService.startGame(room, config as any);
  if (!success) return { success: false, error: 'Cannot start game' };
  return { success: true };
}

export function castVote(roomId: string, voterId: string, targetId: string): { success: boolean; error?: string; roundEnded?: boolean; result?: any } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Room not found' };

  const success = VoteService.castVote(room, voterId, targetId);
  if (!success) return { success: false, error: 'Invalid vote' };

  if (VoteService.hasAllVoted(room)) {
    const result = VoteService.resolveVotes(room);
    const winner = GameService.checkWinCondition(room);

    if (winner) {
      room.setPhase('finished');
      room.gameState!.winner = winner;
      if (winner === 'civilians') room.gameState!.scores.civilians++;
      else room.gameState!.scores.undercover++;
    } else {
      room.setPhase('reveal');
    }

    return { success: true, roundEnded: true, result };
  }

  return { success: true };
}

export function nextTurn(roomId: string, playerId: string): { success: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== playerId) return { success: false, error: 'Only host can advance turn' };

  GameService.nextTurn(room);
  broadcastToRoom(roomId, 'turn:changed', { currentTurnIndex: room.gameState?.currentTurnIndex });
  return { success: true };
}

export function startVoting(roomId: string, playerId: string): { success: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== playerId) return { success: false, error: 'Only host can start voting' };

  GameService.startVoting(room);
  broadcastToRoom(roomId, 'phase:changed', { phase: 'voting' });
  return { success: true };
}

export function nextRound(roomId: string, playerId: string): { success: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== playerId) return { success: false, error: 'Only host can advance' };

  GameService.startNewRound(room);
  return { success: true };
}

export function resetGame(roomId: string, playerId: string): { success: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== playerId) return { success: false, error: 'Only host can reset' };

  GameService.resetGame(room);
  return { success: true };
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}

const sseStreams = new Map<string, Set<{ push: (data: string) => void }>>();

export function addSSEStream(roomId: string, stream: { push: (data: string) => void }): void {
  if (!sseStreams.has(roomId)) sseStreams.set(roomId, new Set());
  sseStreams.get(roomId)!.add(stream);
}

export function removeSSEStream(roomId: string, stream: { push: (data: string) => void }): void {
  sseStreams.get(roomId)?.delete(stream);
}

export function broadcastToRoom(roomId: string, event: string, data: any): void {
  const streams = sseStreams.get(roomId);
  if (!streams) return;
  for (const stream of streams) {
    try { stream.push(JSON.stringify({ event, data })); } catch {}
  }
}

export function cleanupInactiveRooms(): void {
  rooms.forEach((room, id) => { if (room.isInactive()) rooms.delete(id); });
}

setInterval(cleanupInactiveRooms, 60000);