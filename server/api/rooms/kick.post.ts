export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, hostId, targetId } = body;

  const result = kickPlayer(roomId, hostId, targetId);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  return { success: true };
});