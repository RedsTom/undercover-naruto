export default defineEventHandler((event) => {
  const { id } = event.context.params!;
  const room = getRoom(id as string);

  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const stream = createEventStream(event, { pingInterval: 15000 });

  addSSEStream(id as string, { push: stream.push.bind(stream) });

  stream.push(JSON.stringify({ event: 'connected', data: room.toPublic() }));

  stream.onClosed(() => {
    removeSSEStream(id as string, { push: stream.push.bind(stream) });
  });

  return stream.send();
});