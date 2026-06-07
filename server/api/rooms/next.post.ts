export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, playerId } = body;

  const room = getRoom(roomId);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const result = nextRound(room, playerId);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  broadcastToRoom(roomId, 'phase:changed', room.toPublic());

  return { success: true };
});