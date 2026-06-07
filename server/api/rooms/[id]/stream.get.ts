export default defineEventHandler((event) => {
  const { id } = event.context.params!;
  const query = getQuery(event);
  const playerId = query.playerId as string;
  const room = getRoom(id as string);

  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const stream = createEventStream(event);

  addSSEStream(id as string, playerId || 'unknown', stream);

  stream.onClosed(() => {
    const pid = removeSSEStream(id as string, stream);
    if (pid && pid !== 'unknown') {
      handlePlayerDisconnect(id as string, pid);
    }
  });

  return stream.send().catch(() => {});
});
