export default defineEventHandler(async (event) => {
  const { id } = event.context.params!;
  const body = await readBody(event);
  const { playerId, leaving } = body;

  if (!playerId) {
    throw createError({ statusCode: 400, message: 'Missing playerId' });
  }

  const room = getRoom(id as string);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  if (leaving) {
    handlePlayerDisconnect(id as string, playerId);
    return { ok: true };
  }

  const player = room.getPlayer(playerId);
  if (player) {
    player.lastPing = Date.now();
    room.updateActivity();
  }

  return { ok: true };
});
