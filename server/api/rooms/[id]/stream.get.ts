export default defineEventHandler(async (event) => {
  const { id } = event.context.params!;
  const room = getRoom(id as string);

  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const stream = createEventStream(event, { pingInterval: 5000 });

  addSSEStream(id as string, { push: stream.push.bind(stream) });

  try {
    await stream.push(JSON.stringify({ event: 'connected', data: room.toPublic() }));
  } catch {}

  stream.onClosed(() => {
    removeSSEStream(id as string, { push: stream.push.bind(stream) });
  });

  try {
    await stream.send();
  } catch {}
});