export default defineEventHandler(async (event) => {
  const { id } = event.context.params!;
  const body = await readBody(event);
  const { playerId: currentHostId, targetPlayerId } = body;

  if (!currentHostId || !targetPlayerId) {
    throw createError({ statusCode: 400, message: 'Missing currentHostId or targetPlayerId' });
  }

  const room = getRoom(id as string);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  if (room.hostId !== currentHostId) {
    throw createError({ statusCode: 403, message: 'Only the host can transfer ownership' });
  }

  const target = room.getPlayer(targetPlayerId);
  if (!target) {
    throw createError({ statusCode: 404, message: 'Target player not found' });
  }

  const current = room.getPlayer(currentHostId);
  if (current) {
    current.isHost = false;
  }

  target.isHost = true;
  room.hostId = targetPlayerId;
  room.updateActivity();

  broadcastToRoom(room.id, 'room:updated', room.toPublic());
  broadcastToRoom(room.id, 'host:changed', { newHostId: targetPlayerId });

  return { success: true };
});
