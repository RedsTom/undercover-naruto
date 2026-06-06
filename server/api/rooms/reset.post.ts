export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, playerId: pid } = body;

  const room = getRoom(roomId);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const result = resetGame(room, pid);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  broadcastToRoom(roomId, 'game:reset', room.toPublic());

  return { success: true };
});
