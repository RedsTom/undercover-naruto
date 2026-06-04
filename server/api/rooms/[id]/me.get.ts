export default defineEventHandler((event) => {
  const { id } = event.context.params!;
  const playerId = getQuery(event).playerId as string;

  const room = getRoom(id as string);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  return room.toPrivate(playerId || '');
});