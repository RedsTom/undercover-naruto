import { RoomModel, PlayerModel } from '../models';

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

export function createRoom(hostName: string, anime: string = 'naruto'): { room: RoomModel; player: PlayerModel } {
  const roomId = Math.random().toString(36).substring(2, 10);
  const roomCode = generateRoomCode();
  const playerId = Math.random().toString(36).substring(2, 10);
  const room = new RoomModel(roomId, roomCode, playerId, 8, anime);
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

export function kickPlayer(room: RoomModel, hostId: string, targetId: string): { success: boolean; error?: string } {
  if (room.hostId !== hostId) return { success: false, error: 'Only host can kick players' };
  if (hostId === targetId) return { success: false, error: 'Cannot kick yourself' };
  if (room.gameState?.phase && room.gameState.phase !== 'waiting') return { success: false, error: 'Cannot kick during a game' };
  const removed = room.removePlayer(targetId);
  if (!removed) return { success: false, error: 'Player not found' };
  if (room.players.size === 0) rooms.delete(room.id);
  return { success: true };
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}

setInterval(() => {
  rooms.forEach((room, id) => { if (room.isInactive()) rooms.delete(id); });
}, 60000);
