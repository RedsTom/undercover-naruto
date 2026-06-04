export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomCode, playerName } = body;

  if (!roomCode || !playerName || typeof playerName !== 'string' || playerName.trim().length < 2) {
    throw createError({ statusCode: 400, message: 'Room code and player name are required' });
  }

  const result = joinRoom(roomCode, playerName.trim());

  if ('error' in result) {
    throw createError({ statusCode: 404, message: result.error });
  }

  broadcastToRoom(result.room.id, 'room:updated', result.room.toPublic());

  return {
    success: true,
    roomId: result.room.id,
    roomCode: result.room.code,
    playerId: result.player.id,
    room: result.room.toPublic(),
  };
});