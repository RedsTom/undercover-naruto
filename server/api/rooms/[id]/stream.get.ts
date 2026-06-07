export default defineEventHandler((event) => {
  const { id } = event.context.params!;
  const room = getRoom(id as string);

  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const stream = createEventStream(event);

  addSSEStream(id as string, stream);

  setTimeout(async () => {
    try {
      await stream.push({ event: 'connected', data: JSON.stringify(room.toPublic()) });
    } catch {}
  }, 0);

  stream.onClosed(() => {
    removeSSEStream(id as string, stream);
  });

  return stream.send();
});