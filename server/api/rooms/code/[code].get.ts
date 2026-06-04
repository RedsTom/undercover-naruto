export default defineEventHandler((event) => {
  const { code } = event.context.params!;
  const room = getRoomByCode(code as string);

  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  return room.toPublic();
});