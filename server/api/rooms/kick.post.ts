export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, hostId, targetId } = body;

  const room = getRoom(roomId);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const result = kickPlayer(room, hostId, targetId);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  broadcastToRoom(roomId, 'player:kicked', { playerId: targetId });
  broadcastToRoom(roomId, 'room:updated', room.toPublic());

  return { success: true };
});
