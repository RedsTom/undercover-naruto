export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, playerId, config } = body;

  const room = getRoom(roomId);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const result = startGame(room, playerId, config);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  broadcastToRoom(roomId, 'game:started', room.toPublic());

  return { success: true, gameState: room.gameState };
});