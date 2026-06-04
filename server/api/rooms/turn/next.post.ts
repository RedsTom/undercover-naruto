export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, playerId } = body;

  const result = nextTurn(roomId, playerId);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  return { success: true };
});
