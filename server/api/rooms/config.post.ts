export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, playerId, config } = body;

  const room = getRoom(roomId);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  if (room.hostId !== playerId) {
    throw createError({ statusCode: 403, message: 'Only host can update config' });
  }

  room.pendingConfig = config;
  broadcastToRoom(roomId, 'room:updated', room.toPublic());
  room.updateActivity();

  return { success: true };
});
